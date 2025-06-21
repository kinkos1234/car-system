"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      // 토큰과 사용자 정보를 sessionStorage에 저장
      sessionStorage.setItem("token", res.token);
      if (res.user) sessionStorage.setItem("user", JSON.stringify(res.user));
      router.push("/car");
    } catch (err: any) {
      setError("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 및 헤더 */}
        <div className="text-center">
          <div className="text-4xl font-bold text-sky-400 mb-2">🚗</div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Comad J CAR System</h2>
          <p className="text-zinc-400 text-sm">Customer Account Review System</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                로그인 ID
              </label>
              <input
                id="email"
                type="text"
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 transition-colors"
                placeholder="아이디를 입력하세요"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 transition-colors"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                <div className="text-red-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>

        {/* 추가 정보 */}
        <div className="text-center">
          <p className="text-zinc-500 text-xs">
            시스템 접속에 문제가 있으시면 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
} 