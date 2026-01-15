-- Create client_phone_numbers table to track phone number allocations to clients
CREATE TABLE public.client_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allocated_by UUID NOT NULL,
  allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, phone_number)
);

-- Enable RLS
ALTER TABLE public.client_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to client_phone_numbers"
  ON public.client_phone_numbers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Clients can view their own phone numbers
CREATE POLICY "Clients can view their own phone numbers"
  ON public.client_phone_numbers
  FOR SELECT
  USING (has_role(auth.uid(), 'client'::app_role) AND client_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_client_phone_numbers_updated_at
  BEFORE UPDATE ON public.client_phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();