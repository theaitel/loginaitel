-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  agent_id UUID REFERENCES public.aitel_agents(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  concurrency_level INTEGER NOT NULL DEFAULT 5,
  total_leads INTEGER DEFAULT 0,
  contacted_leads INTEGER DEFAULT 0,
  interested_leads INTEGER DEFAULT 0,
  not_interested_leads INTEGER DEFAULT 0,
  partially_interested_leads INTEGER DEFAULT 0,
  google_sheet_id TEXT,
  google_sheet_range TEXT,
  api_endpoint TEXT,
  api_key TEXT,
  api_headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_leads table
CREATE TABLE public.campaign_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'interested', 'not_interested', 'partially_interested', 'site_visit_done', 'negotiation', 'token_paid', 'closed', 'lost')),
  interest_level TEXT CHECK (interest_level IN ('interested', 'not_interested', 'partially_interested', 'unknown')),
  call_id UUID REFERENCES public.calls(id),
  call_status TEXT,
  call_duration INTEGER,
  call_summary TEXT,
  call_sentiment TEXT,
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Clients can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can create their own campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can update their own campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can delete their own campaigns" 
ON public.campaigns 
FOR DELETE 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Admins can view all campaigns" 
ON public.campaigns 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all campaigns" 
ON public.campaigns 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Campaign leads policies
CREATE POLICY "Clients can view their own campaign leads" 
ON public.campaign_leads 
FOR SELECT 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can create their own campaign leads" 
ON public.campaign_leads 
FOR INSERT 
WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can update their own campaign leads" 
ON public.campaign_leads 
FOR UPDATE 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can delete their own campaign leads" 
ON public.campaign_leads 
FOR DELETE 
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Admins can view all campaign leads" 
ON public.campaign_leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all campaign leads" 
ON public.campaign_leads 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_leads_updated_at
BEFORE UPDATE ON public.campaign_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for campaign leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;