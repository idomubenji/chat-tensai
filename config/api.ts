export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  tensaiKey: process.env.NEXT_PUBLIC_TENSAI_KEY!,
  environment: process.env.NODE_ENV
};

// Type guard for environment
export function isValidEnvironment(env: string): env is 'development' | 'production' {
  return env === 'development' || env === 'production';
} 