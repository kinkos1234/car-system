"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

type Customer = {
  id: number;
  group: string;
  company: string;
  department: string;
  name: string;
  phone: string;
};

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch("/api/customer")
      .then((data) => {
        const customerData = data.items || data || [];
        setAllCustomers(customerData);
        setCustomers(customerData);
      })
      .catch((err) => setError(err.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = allCustomers;

    if (groupFilter) {
      filtered = filtered.filter(c => c.group === groupFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(c => c.department === departmentFilter);
    }

    setCustomers(filtered);
  }, [allCustomers, groupFilter, departmentFilter]);

  // 검색 실행
  const handleSearch = () => {
    let filtered = allCustomers;

    if (groupFilter) {
      filtered = filtered.filter(c => c.group === groupFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(c => c.department === departmentFilter);
    }

    if (searchName.trim()) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setCustomers(filtered);
  };

  // 검색창 엔터키 처리
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setGroupFilter("");
    setDepartmentFilter("");
    setSearchName("");
    setCustomers(allCustomers);
  };

  // 고유 그룹/부서 목록 추출
  const uniqueGroups = Array.from(new Set(allCustomers.map(c => c.group).filter(Boolean)));
  const uniqueDepartments = Array.from(new Set(allCustomers.map(c => c.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="p-8 bg-[#0A0B0F] min-h-screen text-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">고객 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#0A0B0F] min-h-screen text-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0A0B0F] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">👥 고객 관리</h1>
              <p className="text-gray-400">등록된 고객 정보를 조회하고 관리할 수 있습니다.</p>
            </div>
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-lg transition-all duration-200 flex items-center gap-2"
              onClick={() => router.push("/customer/new")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              신규 고객 등록
            </button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#181A20] border border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">전체 고객</p>
                  <p className="text-2xl font-bold text-white">{allCustomers.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#181A20] border border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">고객사 수</p>
                  <p className="text-2xl font-bold text-white">{uniqueGroups.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#181A20] border border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">검색 결과</p>
                  <p className="text-2xl font-bold text-white">{customers.length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 필터 및 검색 영역 */}
        <div className="mb-6 bg-[#181A20] border border-[#333] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">🔍 검색 및 필터</h3>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              초기화
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 그룹 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">그룹</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0B0F] text-white border border-[#333] rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">전체 그룹</option>
                {uniqueGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {/* 부서 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">부서</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0B0F] text-white border border-[#333] rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">전체 부서</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* 이름 검색 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">이름 검색</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="고객 이름을 입력하세요..."
                  className="w-full px-3 py-2.5 bg-[#0A0B0F] text-white border border-[#333] rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-12"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-white hover:bg-blue-600 rounded transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="bg-[#181A20] border border-[#333] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0A0B0F] border-b border-[#333]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">그룹</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">회사명</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">부서</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">담당자</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {customers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-[#0A0B0F] transition-colors ${index % 2 === 0 ? 'bg-[#181A20]' : 'bg-[#1A1C22]'}`}
                    data-testid={`customer-row-${customer.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 text-sm font-bold">
                          {customer.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{customer.group}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{customer.company || customer.group || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200">
                        {customer.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{customer.name}</div>
                          <div className="text-sm text-gray-400">{customer.phone || '연락처 없음'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        data-testid={`customer-detail-btn-${customer.id}`}
                        onClick={() => router.push(`/customer/${customer.id}`)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-lg font-medium mb-2">고객 데이터가 없습니다</p>
                        <p className="text-gray-500 text-sm">검색 조건을 변경하거나 새로운 고객을 등록해보세요.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 푸터 정보 */}
        {customers.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
            <p>총 {customers.length}명의 고객이 표시되고 있습니다.</p>
            <p>전체 {allCustomers.length}명 중 {customers.length}명 표시</p>
          </div>
        )}
      </div>
    </div>
  );
} 