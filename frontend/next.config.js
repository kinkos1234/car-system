/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포를 위한 최소 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 이미지 최적화
  images: {
    unoptimized: true,
  },
  
  // 성능 최적화
  swcMinify: true,
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig; 