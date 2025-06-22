import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 배포를 위한 최소 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 프로덕션 최적화
  swcMinify: true,
  
  // 이미지 최적화
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
