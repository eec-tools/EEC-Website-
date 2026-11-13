/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The privacy policy moved from /privacy to /privacy-policy; keep old links working.
  async redirects() {
    return [{ source: "/privacy", destination: "/privacy-policy", permanent: true }];
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
