// Environment variables for Jest tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Storage configuration (mock values)
process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'mock-access-key-id';
process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'mock-secret-access-key';
process.env.CLOUDFLARE_R2_BUCKET_NAME = 'mock-bucket';
process.env.CLOUDFLARE_R2_ACCOUNT_ID = 'mock-account-id';

// App configuration
process.env.MAX_FILE_SIZE = '5242880'; // 5MB
process.env.FREE_USER_DAILY_LIMIT = '5';
process.env.MONTHLY_BUDGET_LIMIT = '100';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Database (mock values for tests that might need them)
process.env.SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

// AI Providers (mock values)
process.env.GOOGLE_AI_API_KEY = 'mock-google-ai-key';
process.env.REPLICATE_API_TOKEN = 'mock-replicate-token';
process.env.OPENAI_API_KEY = 'mock-openai-key';