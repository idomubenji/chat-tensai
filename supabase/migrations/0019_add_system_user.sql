-- Add system user for general channel creation
INSERT INTO public.users (id, email, name, status, role)
VALUES (
  'system',
  'system@chat-tensai.local',
  'System',
  'ONLINE',
  'SYSTEM'
) ON CONFLICT (id) DO NOTHING; 