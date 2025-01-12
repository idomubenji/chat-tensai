/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
        hostname: 'img.clerk.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
