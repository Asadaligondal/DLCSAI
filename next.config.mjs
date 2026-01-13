// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   // Disable SWC minification if you encounter issues
//   swcMinify: true,
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Ignore TypeScript Errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Ignore ESLint Errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;