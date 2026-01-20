-- Add batch_id column to calls table for batch analytics
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS batch_id text;

-- Create index for faster batch queries
CREATE INDEX IF NOT EXISTS idx_calls_batch_id ON public.calls(batch_id);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_calls_status_connected ON public.calls(status, connected);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);