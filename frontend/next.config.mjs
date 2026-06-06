/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    VITE_API_URL: process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env.VITE_API_URL': JSON.stringify(
          process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        ),
      })
    );
    return config;
  },
};

export default nextConfig;
