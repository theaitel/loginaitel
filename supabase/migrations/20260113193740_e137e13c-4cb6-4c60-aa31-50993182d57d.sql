-- Allow engineers to insert leads for clients whose agents they work on
CREATE POLICY "Engineers can insert leads for their agents clients" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'engineer'::app_role) 
  AND uploaded_by = auth.uid()
  AND client_id IN (
    SELECT DISTINCT ba.client_id 
    FROM bolna_agents ba 
    WHERE ba.engineer_id = auth.uid() 
    AND ba.client_id IS NOT NULL
  )
);

-- Allow admins to insert leads for any client
CREATE POLICY "Admins can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));