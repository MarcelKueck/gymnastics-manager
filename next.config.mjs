/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  async redirects() {
    return [
      {
        source: '/athlete/cancellations',
        destination: '/athlete/schedule',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
