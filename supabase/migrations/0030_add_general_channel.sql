-- Create system user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE role = 'SYSTEM'
    ) THEN
        INSERT INTO users (name, email, role, status)
        VALUES (
            'System',
            'system@chat-tensai.app',
            'SYSTEM',
            'OFFLINE'
        );
    END IF;
END $$;

-- Insert #general channel if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM channels WHERE name = '#general'
    ) THEN
        INSERT INTO channels (name, description, created_by_id)
        VALUES (
            '#general',
            'General discussion channel',
            (SELECT id FROM users WHERE role = 'SYSTEM' LIMIT 1)
        );
    END IF;
END $$; 