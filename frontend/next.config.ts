import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 성능 최적화 설정
  turbopack: {
    // Turbopack 최적화 활성화
  },
  experimental: {
    // 메모리 사용량 최적화
    workerThreads: false,
  },
  
  // 🔥 파일 시스템 최적화
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 개발 모드에서 파일 감시 최적화
      config.watchOptions = {
        poll: false, // 폴링 비활성화
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
          '**/coverage/**',
          '**/dist/**',
          '**/build/**',
        ],
      };
    }
    return config;
  },

  // 배포를 위한 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4000/api/:path*"
      }
    ];
  }
};

export default nextConfig;
