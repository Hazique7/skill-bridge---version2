/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increases the limit to 5MB
    },
  },
};

export default nextConfig;