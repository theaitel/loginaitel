-- Add 'rejected' status support and create the trigger for point awards
-- The function already exists, just need the trigger

-- Create trigger for awarding points on task completion
DROP TRIGGER IF EXISTS trigger_award_task_points ON public.tasks;
CREATE TRIGGER trigger_award_task_points
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.award_task_points();