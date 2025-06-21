"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/utils/api";
import { useRouter } from "next/navigation";
import { calculateCarStatus, addStatusToCars, type CarStatus } from "@/utils/carStatus";

type CustomerContact = {
  id: number;
  name: string;
  group: string;
  department: string;
  phone: string;
  memo?: string;
};

type Car = {
  id: number;
  corporation: string;
  customerContacts: CustomerContact[];
  eventType: "ONE_TIME" | "CONTINUOUS";
  status?: string;
  issueDate: string;
  importance: number;
  completionDate?: string;
  dueDate?: string;
  score?: number;
  internalContact?: string;
};

type User = {
  id: number;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
};

export default function CarListPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [filters, setFilters] = useState({
    corporation: "전체",
    customerGroup: "전체",
    eventType: "전체",
    status: "전체",
    issueDateStart: "",
    issueDateEnd: "",
    search: ""
  });
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- 전체 데이터 조회 (페이징 제거) ---
  const [total, setTotal] = useState(0);

  // 1. filterOptions 상태 추가
  const [filterOptions, setFilterOptions] = useState({
    corporations: [],
    customers: [],
    departments: [],
    mainCategories: [],
    eventTypes: [],
  });

  // 2. 마운트 시 전체 옵션 fetch (1회만)
  useEffect(() => {
    apiFetch('/api/car/filters')
      .then(setFilterOptions)
      .catch(() => setFilterOptions({ corporations: [], customers: [], departments: [], mainCategories: [], eventTypes: [] }));
  }, []);

  // status 값 매핑
  const statusMap: Record<string, string> = {
    "전체": "",
    "IN_PROGRESS": "in_progress",
    "CLOSED": "closed",
    // 필요시 DELAYED 등 추가
  };
  const statusParam = (filters.status in statusMap) ? statusMap[filters.status] : "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 백엔드 API 파라미터 구성
        const params = new URLSearchParams();
        if (filters.corporation !== "전체") params.append("corp", filters.corporation);
        if (filters.customerGroup !== "전체") params.append("customerGroup", filters.customerGroup);
        if (filters.issueDateStart) params.append("issueDateStart", filters.issueDateStart);
        if (filters.issueDateEnd) params.append("issueDateEnd", filters.issueDateEnd);
        if (filters.search) params.append("search", filters.search);
        params.append("page", "1");
        params.append("limit", "1000"); // 전체 데이터 요청

        const result = await apiFetch(`/api/car?${params}`);
        setCars(result.items || []);
        setTotal(result.total || 0);
        
        // 필터 옵션은 별도로 가져오기
        const filterResult = await apiFetch("/api/car/filters");
        setFilterOptions(filterResult);
      } catch (err: any) {
        setError(err.message || "데이터 로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters.corporation, filters.customerGroup, filters.issueDateStart, filters.issueDateEnd, filters.search, filters.status, filters.eventType]);

  // 서버에서 받은 cars에 통합된 상태 계산 함수로 status 추가 후 필터링
  const filteredCars = useMemo(() => {
    // 1. cars에 통합된 상태 계산 함수로 status 추가 (백엔드와 동일한 로직)
    const carsWithStatus = addStatusToCars(cars);

    // 2. 프론트에서 status, eventType 필터링
    return carsWithStatus.filter(car => {
      // status 필터
      if (filters.status !== "전체" && car.status !== filters.status) {
        return false;
      }
      // eventType 필터
      if (filters.eventType !== "전체" && car.eventType !== filters.eventType) {
        return false;
      }
      return true;
    });
  }, [cars, filters.status, filters.eventType]);

  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem("user");
      if (userStr) setUser(JSON.parse(userStr));
    } catch {}
  }, []);

  // 3. 드롭다운 옵션 생성 (cars/carsWithStatus 사용 X)
  const corporationOptions = ["전체", ...((filterOptions.corporations || []))];
  const customerGroupOptions = [
    "전체",
    ...((filterOptions.customers || []))
  ];
  const departmentOptions = ["전체", ...((filterOptions.departments || []))];
  const mainCategoryOptions = ["전체", ...((filterOptions.mainCategories || []))];
  const eventTypeOptions = ["전체", ...((filterOptions.eventTypes || []))];

  // 삭제 핸들러
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/car/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('삭제 실패');
      setCars(prev => prev.filter(car => car.id !== id));
    } catch (e: any) {
      alert(e.message || '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  const [searchInput, setSearchInput] = useState(filters.search);

  // BigInt를 포함한 날짜 타입을 안전하게 포맷팅하는 함수
  function formatDate(dateValue: any): string {
    if (!dateValue) return '-';
    
    // BigInt인 경우 Number로 변환
    if (typeof dateValue === 'bigint') {
      dateValue = Number(dateValue);
    }
    
    // 문자열 숫자인 경우 Number로 변환
    if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
      dateValue = Number(dateValue);
    }
    
    // 이미 YYYY-MM-DD 형태 문자열인 경우 그대로 사용
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.slice(0, 10);
    }
    
    // 숫자(timestamp)인 경우 Date 객체로 변환
    const date = new Date(dateValue);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) return '-';
    
    return date.toISOString().slice(0, 10);
  }

  const handleSearch = () => {
    setFilters(f => ({ ...f, search: searchInput }));
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-zinc-400">로딩 중...</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="text-center">
        <div className="text-red-400 text-lg mb-2">⚠️ 오류 발생</div>
        <div className="text-zinc-400">{error}</div>
      </div>
    </div>
  );
  
  if (filterOptions.corporations.length === 0 && filterOptions.customers.length === 0 && filterOptions.eventTypes.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">⚠️ 설정 오류</div>
          <div className="text-zinc-400">필터 옵션을 불러올 수 없습니다. 관리자에게 문의하세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 lg:p-8">
      <div className="max-w-full mx-auto px-2 lg:px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-zinc-100">📋 CAR 리스트</h1>
          {/* 우측 버튼 2개: 고객 정보 관리, 신규 등록 */}
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl font-medium shadow-md hover:shadow-lg transition-all duration-150 border border-zinc-700"
              onClick={() => router.push("/car/customer")}
            >
              👥 고객 정보 관리
            </button>
            <button
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-medium shadow-md hover:shadow-lg transition-all duration-150"
              onClick={() => router.push("/car/new")}
            >
              ➕ 신규 등록
            </button>
          </div>
        </div>
        {/* 필터 영역 */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 lg:p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">법인</label>
              <select className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" value={filters.corporation} onChange={e => setFilters(f => ({ ...f, corporation: e.target.value }))}>
                {corporationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">고객사</label>
              <select className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" value={filters.customerGroup} onChange={e => setFilters(f => ({ ...f, customerGroup: e.target.value }))}>
                {customerGroupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">타입</label>
              <select className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" value={filters.eventType} onChange={e => setFilters(f => ({ ...f, eventType: e.target.value }))}>
                {eventTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">상태</label>
              <select className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                {["전체", "CLOSED", "IN_PROGRESS", "DELAYED"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">시작월</label>
              <input type="month" className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" style={{ colorScheme: 'dark' }} value={filters.issueDateStart} onChange={e => setFilters(f => ({ ...f, issueDateStart: e.target.value }))} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-300 mb-2">종료월</label>
              <input type="month" className="h-10 px-2 text-sm w-full rounded-lg bg-zinc-950 border border-zinc-600 text-zinc-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400" style={{ colorScheme: 'dark' }} value={filters.issueDateEnd} onChange={e => setFilters(f => ({ ...f, issueDateEnd: e.target.value }))} />
            </div>
            <div className="flex flex-col col-span-2">
              <label className="text-sm font-medium text-zinc-300 mb-2">검색</label>
              <div className="flex">
                <input
                  type="text"
                  className="h-10 px-3 text-sm flex-1 min-w-0 rounded-l-lg bg-zinc-950 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  placeholder="검색어를 입력하세요"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchInputKeyDown}
                />
                <button
                  className="px-4 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-r-lg transition-colors flex-shrink-0"
                  onClick={handleSearch}
                  aria-label="검색"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="11" cy="11" r="7" strokeWidth="2"/>
                    <path strokeWidth="2" d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* 테이블 영역 */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1600px]">
            <thead>
              <tr className="bg-zinc-800 border-b border-zinc-700">
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[100px]">발행일</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[80px]">법인</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[120px]">타입</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[120px]">상태</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[150px]">고객사</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[120px]">부서</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[140px]">고객담당자</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[140px]">내부담당자</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[100px]">기한일</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[100px]">마감일</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[80px]">SCORE</th>
                <th className="font-semibold px-3 py-3 text-center text-zinc-300 min-w-[200px]">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map(car => (
                                 <tr key={car.id} className="hover:bg-zinc-800 transition-colors border-b border-zinc-700 last:border-b-0">
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{formatDate(car.issueDate)}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.corporation}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.eventType}</td>
                   <td className="px-3 py-3 text-center">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       car.status === 'CLOSED' ? 'bg-emerald-900/30 text-emerald-400' :
                       car.status === 'IN_PROGRESS' ? 'bg-sky-900/30 text-sky-400' :
                       car.status === 'DELAYED' ? 'bg-red-900/30 text-red-400' :
                       'bg-zinc-700 text-zinc-400'
                     }`}>
                       {car.status}
                     </span>
                   </td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map((cc: CustomerContact) => cc.group).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i).join(', ') : '-'}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map((cc: CustomerContact) => cc.department).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i).join(', ') : '-'}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map((cc: CustomerContact, i: number) => (<span key={cc.id}>{cc.name}<br /></span>)) : '-'}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{car.internalContact ? car.internalContact.split(',').map((c, i) => <span key={i}>{c.trim()}<br /></span>) : '-'}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{formatDate(car.dueDate)}</td>
                   <td className="px-3 py-3 text-center text-zinc-100 text-sm">{formatDate(car.completionDate)}</td>
                   <td className="px-3 py-3 text-center">
                     <span className="font-semibold text-sky-400 text-sm">
                       {car.score !== undefined && car.score !== null ? Number(car.score).toFixed(1) : '-'}
                     </span>
                   </td>
                   <td className="px-3 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-medium transition-colors border border-zinc-600"
                        onClick={() => router.push(`/car/${car.id}`)}
                      >
                        상세
                      </button>
                      <button
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                        onClick={() => router.push(`/car/${car.id}/edit`)}
                      >
                        수정
                      </button>
                      <button
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deletingId === car.id}
                        onClick={() => handleDelete(car.id)}
                      >
                        {deletingId === car.id ? '삭제중...' : '삭제'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCars.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="text-zinc-400">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2m0 0V4m0 3h2m-2 0H8" />
                      </svg>
                      <div className="text-lg font-medium">데이터가 없습니다</div>
                      <div className="text-sm mt-1">검색 조건을 변경하거나 새 CAR을 등록해보세요.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      
        {/* 결과 통계 표시 */}
        <div className="mt-4 text-center text-sm text-zinc-400">
          총 {filteredCars.length}개의 CAR이 표시되고 있습니다
        </div>
      </div>
    </div>
  );
}