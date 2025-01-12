/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output only in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tensai-bucket.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NODE_ENV === 'development' 
          ? 'tensai-bucket-dev.s3.us-east-1.amazonaws.com'
          : 'tensai-bucket.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Add environment-specific settings
  env: {
    NEXT_PUBLIC_ENV: process.env.NODE_ENV,
  },
};

export default nextConfig;
