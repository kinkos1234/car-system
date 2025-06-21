"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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

export default function UserDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    const curr = getCurrentUser();
    setCurrentUser(curr);
    
    // ADMIN 권한 체크
    if (!curr || curr.role !== 'ADMIN') {
      // 인증되지 않은 경우 로그인 페이지로, 권한 없는 경우 CAR 페이지로
      if (!curr) {
        router.push('/login');
      } else {
        router.push('/car');
      }
      return;
    }
    
    loadUser();
  }, [userId, router]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/users/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        throw new Error(`Failed to load user: ${response.status}`);
      }

      const data = await response.json();
      setUser(data);
    } catch (err: any) {
      console.error('사용자 로드 오류:', err);
      setError(err.message || '사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`사용자 "${user.name}"을(를) 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
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
      router.push('/admin');
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

  const getRoleDescription = (role: string) => {
    const descriptions = {
      ADMIN: '최고 관리자 - 모든 기능 및 사용자 관리',
      MANAGER: '관리자 - 기본 기능',
      STAFF: '일반 사용자 - 기본 기능만 접근 가능'
    };
    return descriptions[role as keyof typeof descriptions] || '알 수 없는 역할';
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="text-center">
          <div className="text-red-400 text-xl">⚠️ 접근 권한이 없습니다.</div>
          <div className="text-gray-400 mt-2">ADMIN 권한이 필요합니다.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>사용자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              ← 뒤로가기
            </Link>
            <h1 className="text-3xl font-bold">📋 사용자 상세</h1>
          </div>
          
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-8 text-center">
            <div className="text-red-400 text-xl mb-2">⚠️ 오류 발생</div>
            <div className="text-gray-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="text-center">
          <div className="text-gray-400">사용자를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              ← 뒤로가기
            </Link>
            <h1 className="text-3xl font-bold">📋 사용자 상세</h1>
          </div>
          
          <div className="flex gap-3">
            <Link
              href={`/admin/user/${user.id}/edit`}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
            >
              ✏️ 수정
            </Link>
            {currentUser.id !== user.id && (
              <button
                onClick={deleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-[#23242B] rounded-lg border border-[#333] overflow-hidden">
          {/* 헤더 섹션 */}
          <div className="bg-[#181A20] px-8 py-6 border-b border-[#333]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                  <span className="text-gray-400">#{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">기본 정보</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">사용자 ID</label>
                  <div className="text-white font-mono bg-[#1A1B23] px-3 py-2 rounded border">#{user.id}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">로그인 ID</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{user.loginId}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">이름</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{user.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">부서</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{user.department || '-'}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">이메일</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{user.email || '-'}</div>
                </div>
              </div>

              {/* 권한 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">권한 정보</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">역할</label>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">{getRoleDescription(user.role)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">접근 가능 기능</label>
                  <div className="space-y-1 text-sm">
                    <div className="text-green-400">✓ CAR 관리</div>
                    <div className="text-green-400">✓ 대시보드</div>
                    {(['ADMIN', 'MANAGER'].includes(user.role)) && (
                      <div className="text-green-400">✓ 보고서 관리</div>
                    )}
                    {user.role === 'ADMIN' && (
                      <>
                        <div className="text-green-400">✓ AI 분석</div>
                        <div className="text-green-400">✓ 사용자 관리</div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">주간 보고서 이메일</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${user.weeklyReportEmail ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {user.weeklyReportEmail ? '✓ 수신' : '✗ 미수신'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {user.weeklyReportEmail ? '주간 보고서를 이메일로 받습니다.' : '주간 보고서를 이메일로 받지 않습니다.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="pt-6 border-t border-[#333]">
              <h3 className="text-lg font-semibold text-white mb-4">활동 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">계정 생성일</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{formatDate(user.createdAt)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">마지막 수정일</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border">{formatDate(user.updatedAt)}</div>
                </div>
              </div>
            </div>

            {/* 경고 메시지 */}
            {currentUser.id === user.id && (
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="text-yellow-400 font-medium">ℹ️ 현재 로그인된 계정</div>
                <div className="text-gray-300 text-sm mt-1">본인 계정은 삭제할 수 없습니다.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 