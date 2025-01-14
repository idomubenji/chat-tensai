-- Create #general channel with specific UUID if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM channels WHERE name = '#general') THEN
        INSERT INTO channels (id, name, description, created_by_id)
        VALUES (
            'ef670470-91fd-4cb2-b932-9cc03ba0011c',
            '#general',
            'General discussion channel',
            'system'
        );
        RAISE INFO 'Created #general channel with ID: ef670470-91fd-4cb2-b932-9cc03ba0011c';
    ELSE
        RAISE INFO 'Channel #general already exists';
    END IF;
END $$; 