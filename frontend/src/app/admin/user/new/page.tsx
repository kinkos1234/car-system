"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthHeaders } from "@/utils/jwt";

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'STAFF',
    department: '',
    email: '',
    weeklyReportEmail: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    if (!formData.password.trim()) {
      setError('비밀번호는 필수입니다.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          loginId: formData.loginId,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          email: formData.email,
          weeklyReportEmail: formData.weeklyReportEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 생성에 실패했습니다.');
      }

      alert('사용자가 성공적으로 생성되었습니다.');
      router.push('/admin');
    } catch (err: any) {
      console.error('사용자 생성 오류:', err);
      setError(err.message || '사용자 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            ← 뒤로가기
          </Link>
          <h1 className="text-3xl font-bold">👤 새 사용자 등록</h1>
        </div>

        {/* 폼 */}
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

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1B23] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="비밀번호를 다시 입력하세요"
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

            {/* 버튼 */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    등록 중...
                  </div>
                ) : (
                  '사용자 등록'
                )}
              </button>
              <Link
                href="/admin"
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors text-center"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 