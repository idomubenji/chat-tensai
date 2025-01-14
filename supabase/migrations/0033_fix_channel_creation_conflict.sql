-- Drop ALL existing channel creation policies to ensure no conflicts
DROP POLICY IF EXISTS "Admin users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;

-- Create single unified policy for channel creation
CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = created_by_id
);

-- Ensure INSERT permission is granted
GRANT INSERT ON public.channels TO authenticated; 