/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output only in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  images: {
    remotePatterns: [
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

  // Add security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Prevent XSS attacks by explicitly enabling script sources
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Strict transport security (force HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
