-- Add task_id column to agents table to link agents to tasks
ALTER TABLE public.agents 
ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_agents_task_id ON public.agents(task_id);

-- Update RLS policy for engineers to allow inserting agents with task_id
-- (existing policies already allow engineers to insert agents they create)