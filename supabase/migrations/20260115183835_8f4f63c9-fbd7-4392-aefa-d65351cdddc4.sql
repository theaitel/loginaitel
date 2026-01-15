-- Create campaign call queue table for bulk calling
CREATE TABLE public.campaign_call_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.campaign_leads(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    agent_id UUID REFERENCES public.aitel_agents(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    priority INTEGER NOT NULL DEFAULT 0,
    queued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    call_id UUID REFERENCES public.calls(id),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_call_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Clients can view their own campaign queue" 
ON public.campaign_call_queue FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert into their campaign queue" 
ON public.campaign_call_queue FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their campaign queue" 
ON public.campaign_call_queue FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete from their campaign queue" 
ON public.campaign_call_queue FOR DELETE 
USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all campaign queues" 
ON public.campaign_call_queue FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_campaign_call_queue_campaign_id ON public.campaign_call_queue(campaign_id);
CREATE INDEX idx_campaign_call_queue_status ON public.campaign_call_queue(status);
CREATE INDEX idx_campaign_call_queue_client_id ON public.campaign_call_queue(client_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_call_queue_updated_at
BEFORE UPDATE ON public.campaign_call_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_call_queue;