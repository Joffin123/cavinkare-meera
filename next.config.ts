import type { NextConfig } from "next";

// Served at pitch.alttrednexxus.com/cavinkare-meera_131026
const basePath = "/cavinkare-meera_131026";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  async redirects() {
    // Bare domain root (e.g. cavinkare-meera.vercel.app/) → the pitch page
    return [{ source: "/", destination: basePath, basePath: false, permanent: false }];
  },
};

export default nextConfig;
