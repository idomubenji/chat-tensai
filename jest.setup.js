// Load environment variables
require('dotenv').config({ path: '.env.test.local' });

// Increase timeout for all tests
jest.setTimeout(20000); 