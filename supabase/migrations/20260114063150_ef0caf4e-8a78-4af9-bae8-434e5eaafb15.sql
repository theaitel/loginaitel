-- Rename the column bolna_agent_id to aitel_agent_id in tasks table
ALTER TABLE public.tasks RENAME COLUMN bolna_agent_id TO aitel_agent_id;

-- Update RLS policies on aitel_agents that reference tasks.bolna_agent_id
DROP POLICY IF EXISTS "Engineers can view agents via tasks" ON public.aitel_agents;
DROP POLICY IF EXISTS "Engineers can update agent prompts via tasks" ON public.aitel_agents;

CREATE POLICY "Engineers can view agents via tasks" 
ON public.aitel_agents 
FOR SELECT 
USING (
  has_role(auth.uid(), 'engineer'::app_role) 
  AND id IN (
    SELECT tasks.aitel_agent_id
    FROM tasks
    WHERE tasks.assigned_to = auth.uid() AND tasks.aitel_agent_id IS NOT NULL
  )
);

CREATE POLICY "Engineers can update agent prompts via tasks" 
ON public.aitel_agents 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'engineer'::app_role) 
  AND id IN (
    SELECT tasks.aitel_agent_id
    FROM tasks
    WHERE tasks.assigned_to = auth.uid() AND tasks.aitel_agent_id IS NOT NULL
  )
);