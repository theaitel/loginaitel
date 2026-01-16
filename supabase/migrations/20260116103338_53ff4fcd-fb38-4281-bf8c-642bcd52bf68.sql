-- Add policy for engineers to view pending tasks assigned to them specifically
-- This ensures pre-assigned tasks from admin are visible to engineers

-- First check if this specific scenario is already covered
-- The existing policy "Engineers can view assigned tasks" should work
-- but let's make it clearer by including pending status explicitly

-- Drop and recreate the policy to be more explicit
DROP POLICY IF EXISTS "Engineers can view assigned tasks" ON public.tasks;

-- Create new policy that explicitly includes pending tasks assigned to engineer
CREATE POLICY "Engineers can view assigned tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'engineer'::app_role) 
  AND assigned_to = auth.uid()
);

-- Ensure the unassigned pending tasks policy still exists
DROP POLICY IF EXISTS "Engineers can view pending unassigned tasks" ON public.tasks;

CREATE POLICY "Engineers can view pending unassigned tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'engineer'::app_role) 
  AND status = 'pending' 
  AND assigned_to IS NULL
);