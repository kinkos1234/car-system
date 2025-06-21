"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/jwt";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const checkAuth = () => {
      try {
        const authenticated = isAuthenticated();
        
        if (authenticated) {
          // 인증된 사용자는 CAR 페이지로 리다이렉트
          router.replace("/car");
        } else {
          // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
          router.replace("/login");
        }
      } catch (error) {
        console.error('인증 확인 중 오류:', error);
        // 오류 발생 시 로그인 페이지로 리다이렉트
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    // 약간의 지연을 두어 localStorage 접근 보장
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏢</div>
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-zinc-100 font-medium">삼송 CAR 시스템 로딩 중...</div>
          <div className="text-zinc-400 text-sm mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  return null;
}
