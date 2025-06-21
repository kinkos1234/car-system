"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser, getAuthHeaders } from "@/utils/jwt";

interface User {
  id: number;
  loginId: string;
  name: string;
  role: string;
  department: string;
  email: string | null;
  weeklyReportEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // ADMIN 권한 체크
    if (!currentUser || currentUser.role !== 'ADMIN') {
      // 인증되지 않은 경우 로그인 페이지로, 권한 없는 경우 CAR 페이지로
      if (!currentUser) {
        router.push('/login');
      } else {
        router.push('/car');
      }
      return;
    }
    
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/users', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('사용자 목록 로드 오류:', err);
      setError(err.message || '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    if (!confirm(`사용자 "${targetUser.name}"을(를) 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 삭제에 실패했습니다.');
      }

      alert('사용자가 성공적으로 삭제되었습니다.');
      loadUsers(); // 목록 새로고침
    } catch (err: any) {
      console.error('사용자 삭제 오류:', err);
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-red-600 text-white',
      MANAGER: 'bg-blue-600 text-white',
      STAFF: 'bg-green-600 text-white'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-600 text-white';
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="text-center">
          <div className="text-red-400 text-xl">⚠️ 접근 권한이 없습니다.</div>
          <div className="text-zinc-400 mt-2">ADMIN 권한이 필요합니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">🔧 관리자 대시보드</h1>
          <p className="text-zinc-400 mt-2">사용자 관리 및 시스템 설정을 관리합니다.</p>
        </div>

        {/* 빠른 액세스 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/user/new"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-800 transition-all duration-150 shadow-md hover:shadow-lg group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">사용자 추가</h3>
            <p className="text-zinc-400 text-sm">새로운 사용자를 시스템에 등록합니다.</p>
          </Link>

          <Link
            href="/admin/report"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-800 transition-all duration-150 shadow-md hover:shadow-lg group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">보고서 관리</h3>
            <p className="text-zinc-400 text-sm">AI 주간 보고서를 생성하고 관리합니다.</p>
          </Link>

          <Link
            href="/admin/ai"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-800 transition-all duration-150 shadow-md hover:shadow-lg group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">AI 분석</h3>
            <p className="text-zinc-400 text-sm">AI 기반 고객 분석을 수행합니다.</p>
          </Link>
        </div>

        {/* 사용자 관리 섹션 */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-100">👥 사용자 관리</h2>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-4 mb-6">
              <div className="text-red-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* 사용자 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800 border-b border-zinc-700">
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">로그인 ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">이름</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">부서</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">이메일</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">역할</th>
                  <th className="px-4 py-3 text-center font-semibold text-zinc-300">주간보고서</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-300">생성일</th>
                  <th className="px-4 py-3 text-center font-semibold text-zinc-300">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="text-zinc-400">
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div>로딩 중...</div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="text-zinc-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        <div className="text-lg font-medium">등록된 사용자가 없습니다</div>
                        <div className="text-sm mt-1">새 사용자를 추가해보세요.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-zinc-800 border-b border-zinc-700 last:border-b-0 transition-colors">
                      <td className="px-4 py-3 text-zinc-100 font-mono">#{userItem.id}</td>
                      <td className="px-4 py-3 text-zinc-100 font-medium">{userItem.loginId}</td>
                      <td className="px-4 py-3 text-zinc-100 font-medium">{userItem.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{userItem.department || '-'}</td>
                      <td className="px-4 py-3 text-zinc-300">{userItem.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          userItem.role === 'ADMIN' ? 'bg-red-600 text-white' :
                          userItem.role === 'MANAGER' ? 'bg-sky-600 text-white' :
                          userItem.role === 'STAFF' ? 'bg-emerald-600 text-white' :
                          'bg-zinc-600 text-white'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          userItem.weeklyReportEmail ? 'bg-emerald-600 text-white' : 'bg-zinc-600 text-white'
                        }`}>
                          {userItem.weeklyReportEmail ? '✓ 수신' : '✗ 미수신'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">{formatDate(userItem.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Link
                            href={`/admin/user/${userItem.id}`}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-medium transition-colors border border-zinc-600"
                          >
                            상세
                          </Link>
                          <Link
                            href={`/admin/user/${userItem.id}/edit`}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => deleteUser(userItem.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={userItem.id === user.id}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 