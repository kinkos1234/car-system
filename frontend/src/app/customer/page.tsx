"use client";
import { useEffect, useState } from "react";
import { customerAPI } from "@/utils/api";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "@/utils/jwt";
import { User as RoleUser } from "@/utils/role";

interface Customer {
  id: number;
  name: string;
  corporation: string;
  department: string;
  contact: string;
  email?: string;
  position?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<RoleUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  // 사용자 정보 로드
  useEffect(() => {
    setUser(getCurrentUser() as RoleUser | null);
  }, []);

  // 고객 데이터 로드
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      
      if (!isAuthenticated()) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      try {
        const params: Record<string, any> = {};
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        
        const data = await customerAPI.getAll(params);
        setCustomers(Array.isArray(data) ? data : data.items || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || '고객 데이터 로드 실패');
        console.error('Customer load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [searchTerm]);

  // 삭제 핸들러
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    setDeletingId(id);
    try {
      await customerAPI.delete(id.toString());
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // useEffect가 searchTerm 변경을 감지하여 자동으로 로드됨
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              👥 고객 관리
            </h1>
            <p className="text-zinc-400">
              고객 정보를 관리하고 조회할 수 있습니다.
            </p>
          </div>
          
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/customer/new')}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + 새 고객 추가
            </button>
          )}
        </div>

        {/* 검색 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="고객명, 회사명, 부서명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              검색
            </button>
          </form>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-zinc-300">로딩 중...</div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="text-red-400 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* 고객 목록 */}
        {!loading && !error && (
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="text-left p-4 text-zinc-300 font-medium">고객명</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">회사</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">부서</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">연락처</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">이메일</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">등록일</th>
                    <th className="text-left p-4 text-zinc-300 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-zinc-700 hover:bg-zinc-800/50">
                        <td className="p-4 text-zinc-100 font-medium">{customer.name}</td>
                        <td className="p-4 text-zinc-300">{customer.corporation}</td>
                        <td className="p-4 text-zinc-300">{customer.department}</td>
                        <td className="p-4 text-zinc-300">{customer.contact}</td>
                        <td className="p-4 text-zinc-300">{customer.email || '-'}</td>
                        <td className="p-4 text-zinc-300">{formatDate(customer.created_at)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/customer/${customer.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              상세
                            </button>
                            {user?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => router.push(`/customer/${customer.id}/edit`)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDelete(customer.id)}
                                  disabled={deletingId === customer.id}
                                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  {deletingId === customer.id ? '삭제 중...' : '삭제'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500">
                        등록된 고객이 없습니다.
                        {user?.role === 'ADMIN' && (
                          <div className="mt-4">
                            <button
                              onClick={() => router.push('/customer/new')}
                              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              첫 번째 고객 추가하기
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        {!loading && !error && customers.length > 0 && (
          <div className="mt-6 bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">📊 통계</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm">총 고객 수</div>
                <div className="text-2xl font-bold text-sky-400">{customers.length}명</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm">회사 수</div>
                <div className="text-2xl font-bold text-green-400">
                  {new Set(customers.map(c => c.corporation)).size}개
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm">부서 수</div>
                <div className="text-2xl font-bold text-purple-400">
                  {new Set(customers.map(c => c.department)).size}개
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 