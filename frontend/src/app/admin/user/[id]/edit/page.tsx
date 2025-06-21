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

export default function EditUserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    loginId: '',
    name: '',
    role: 'STAFF',
    department: '',
    email: '',
    weeklyReportEmail: false,
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setFormData({
        loginId: data.loginId,
        name: data.name,
        role: data.role,
        department: data.department || '',
        email: data.email || '',
        weeklyReportEmail: data.weeklyReportEmail || false,
        password: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('사용자 로드 오류:', err);
      setError(err.message || '사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.loginId.trim()) {
      setError('로그인 ID는 필수입니다.');
      return false;
    }
    if (!formData.name.trim()) {
      setError('이름은 필수입니다.');
      return false;
    }
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(formData.role)) {
      setError('유효하지 않은 역할입니다.');
      return false;
    }
    
    // 비밀번호가 입력된 경우에만 확인
    if (formData.password.trim() !== '') {
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: any = {
        loginId: formData.loginId,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        email: formData.email,
        weeklyReportEmail: formData.weeklyReportEmail
      };

      // 비밀번호가 입력된 경우에만 포함
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 수정에 실패했습니다.');
      }

      alert('사용자 정보가 성공적으로 수정되었습니다.');
      router.push(`/admin/user/${userId}`);
    } catch (err: any) {
      console.error('사용자 수정 오류:', err);
      setError(err.message || '사용자 수정에 실패했습니다.');
    } finally {
      setSaving(false);
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

  if (error && !user) {
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
            <h1 className="text-3xl font-bold">✏️ 사용자 수정</h1>
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
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/user/${userId}`}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            ← 뒤로가기
          </Link>
          <h1 className="text-3xl font-bold">✏️ 사용자 수정</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 기존 정보 표시 */}
          <div className="lg:col-span-1">
            <div className="bg-[#23242B] rounded-lg border border-[#333] p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">현재 정보</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-gray-400 text-sm">#{user.id}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">로그인 ID</label>
                  <div className="text-white bg-[#1A1B23] px-3 py-2 rounded border text-sm">{user.loginId}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">현재 역할</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">생성일</label>
                  <div className="text-gray-300 text-sm">{formatDate(user.createdAt)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">수정일</label>
                  <div className="text-gray-300 text-sm">{formatDate(user.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 수정 폼 */}
          <div className="lg:col-span-2">
            <div className="bg-[#23242B] rounded-lg border border-[#333] p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 에러 메시지 */}
                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <div className="text-red-400">⚠️ {error}</div>
                  </div>
                )}

                {/* 로그인 ID */}
                <div>
                  <label htmlFor="loginId" className="block text-sm font-medium text-gray-300 mb-2">
                    로그인 ID *
                  </label>
                  <input
                    type="text"
                    id="loginId"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="로그인에 사용할 ID를 입력하세요"
                    required
                  />
                </div>

                {/* 이름 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="사용자의 실명을 입력하세요"
                    required
                  />
                </div>

                {/* 역할 */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                    역할 *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="STAFF">STAFF - 일반 사용자</option>
                    <option value="MANAGER">MANAGER - 관리자</option>
                    <option value="ADMIN">ADMIN - 최고 관리자</option>
                  </select>
                  <div className="mt-2 text-sm text-gray-400">
                    <div>• STAFF: 기본 기능 접근</div>
                    <div>• MANAGER: 보고서 관리 + 기본 기능</div>
                    <div>• ADMIN: 모든 기능 + 사용자 관리</div>
                  </div>
                </div>

                {/* 부서 */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                    부서
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="소속 부서를 입력하세요"
                  />
                </div>

                {/* 이메일 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="이메일 주소를 입력하세요"
                  />
                </div>

                {/* 주간 보고서 이메일 수신 */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="weeklyReportEmail"
                      checked={formData.weeklyReportEmail}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 bg-[#1A1B23] border-[#333] rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-300">주간 보고서 이메일 수신</div>
                      <div className="text-sm text-gray-400">
                        체크하면 주간 보고서를 이메일로 자동 발송받습니다.
                      </div>
                    </div>
                  </label>
                </div>

                {/* 비밀번호 섹션 */}
                <div className="border-t border-[#333] pt-6">
                  <h4 className="text-lg font-medium text-white mb-4">비밀번호 변경 (선택사항)</h4>
                  <div className="space-y-4">
                    {/* 새 비밀번호 */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                        새 비밀번호
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        placeholder="변경하려면 새 비밀번호를 입력하세요"
                      />
                      <div className="mt-1 text-sm text-gray-400">
                        비밀번호를 변경하지 않으려면 빈 칸으로 두세요.
                      </div>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        수정 중...
                      </div>
                    ) : (
                      '수정 완료'
                    )}
                  </button>
                  <Link
                    href={`/admin/user/${userId}`}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors text-center"
                  >
                    취소
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 