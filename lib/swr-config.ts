import { SWRConfiguration } from 'swr';

const isDevelopment = process.env.NODE_ENV === 'development';

export const defaultSWRConfig: SWRConfiguration = {
  // More aggressive revalidation in development
  dedupingInterval: isDevelopment ? 2000 : 5000,
  // Longer cache lifetime in production
  refreshInterval: isDevelopment ? 30000 : 60000,
  // Common settings
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateOnMount: true,
  // Error retry settings
  errorRetryCount: isDevelopment ? 3 : 5,
  errorRetryInterval: isDevelopment ? 2000 : 5000,
  // Suspense mode for better loading states
  suspense: true,
  // Custom error handling
  onError: (error, key) => {
    if (error.status !== 403 && error.status !== 404) {
      console.error(`SWR Error for ${key}:`, error);
    }
  },
  // Custom loading timeout
  loadingTimeout: isDevelopment ? 3000 : 5000,
}; 