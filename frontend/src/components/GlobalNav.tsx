"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, isAuthenticated, clearAuthData } from "@/utils/jwt";

// 네비게이션 메뉴 정의: label, href, roles(허용 권한)
const NAV_MENUS = [
  { label: "CAR", href: "/car", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "고객", href: "/customer", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "대시보드", href: "/dashboard", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "ADMIN", href: "/admin", roles: ["ADMIN"] },
];

export default function GlobalNav() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 사용자 정보 확인 함수
  const checkUserAuth = () => {
    try {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        // 토큰이 만료되었거나 유효하지 않으면 사용자 정보 제거
        setUser(null);
        clearAuthData();
      }
    } catch (error) {
      console.error('인증 확인 중 오류:', error);
      setUser(null);
      clearAuthData();
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUserAuth();
  }, []);

  // 라우터 경로가 바뀔 때마다 user 상태 동기화
  useEffect(() => {
    if (mounted) {
      checkUserAuth();
    }
  }, [pathname, mounted]);

  // 주기적으로 토큰 유효성 검사 (5분마다)
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      checkUserAuth();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [mounted]);

  const handleLogout = () => {
    clearAuthData();
    setUser(null);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  // 메뉴 클릭 핸들러 (권한 체크)
  const handleMenuClick = (menu: any, e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!menu.roles.includes(user.role)) {
      e.preventDefault();
      alert('접근 권한이 없습니다.');
      return;
    }
  };

  // 로그인 페이지에서는 네비게이션 숨김
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="w-full bg-zinc-900 border-b border-zinc-700 text-zinc-100 px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex gap-6 items-center">
        {/* 로고 */}
        <Link 
          href="/car" 
          className="font-bold text-xl text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-2"
        >
          <span className="text-2xl">🚗</span>
          Comad J CAR
        </Link>
        
        {user && (
          <div className="flex gap-1">
            {NAV_MENUS.filter(menu => menu.roles.includes(user.role)).map(menu => (
              <Link 
                key={menu.href} 
                href={menu.href} 
                className={`px-4 py-2 rounded-2xl font-medium transition-all duration-150 ${
                  pathname === menu.href 
                    ? 'bg-sky-500 text-white shadow-md' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
                onClick={(e) => handleMenuClick(menu, e)}
              >
                {menu.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-zinc-100">{user.name}</div>
                <div className="text-xs text-zinc-400">{user.department || user.role}</div>
              </div>
              {user.role === "ADMIN" && (
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium">
                  관리자
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl font-medium transition-all duration-150 border border-zinc-600"
            >
              로그아웃
            </button>
          </>
        ) : (
          mounted && (
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-medium transition-all duration-150 shadow-md hover:shadow-lg"
            >
              로그인
            </button>
          )
        )}
      </div>
    </nav>
  );
} 