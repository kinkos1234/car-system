"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuthHeaders, isAuthenticated, getCurrentUser } from "@/utils/jwt";

interface WeeklyReport {
  id: number;
  title: string | null;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  data: any;
}

export default function ReportListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 체크
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const user = getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      setError('권한이 없습니다. 관리자 또는 매니저만 접근 가능합니다.');
      return;
    }
    
    loadReports();
  }, [router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/report/weekly-reports', {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰이 만료되었거나 유효하지 않음
          router.push('/login');
          return;
        }
        throw new Error(`Failed to load reports: ${response.status}`);
      }

      const data = await response.json();
      setReports(data);
    } catch (err: any) {
      console.error('Report load error:', err);
      setError(err.message || '보고서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰이 만료되었거나 유효하지 않음
          router.push('/login');
          return;
        }
        throw new Error(`Failed to generate report: ${response.status}`);
      }

      // 보고서 생성 후 목록 새로고침
      await loadReports();
      alert('새로운 AI 보고서가 생성되었습니다.');
    } catch (err: any) {
      console.error('Report generation error:', err);
      alert(`보고서 생성 실패: ${err.message}`);
    } finally {
      setLoading(false);
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

  const getDisplayTitle = (report: WeeklyReport) => {
    if (report.title) {
      return report.title;
    }
    // title이 없는 경우 기본 형식으로 생성
    const date = new Date(report.createdAt);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `주간 요약 보고서_${year}${month}${day}`;
  };

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>보고서 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">📊 AI 주간 보고서</h2>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                생성 중...
              </>
            ) : (
              <>
                🤖 새 보고서 생성
              </>
            )}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="text-red-400">⚠️ {error}</div>
          </div>
        )}

        {/* 보고서 목록 */}
        <div className="bg-[#23242B] rounded-lg border border-[#333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#181A20] border-b border-[#333]">
                  <th className="px-6 py-4 text-left font-medium text-gray-300">ID</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-300">제목</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-300">생성일</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-300">분석 고객사 수</th>
                  <th className="px-6 py-4 text-center font-medium text-gray-300">액션</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {loading ? '로딩 중...' : '생성된 보고서가 없습니다. 새 보고서를 생성해보세요.'}
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const customerCount = report.data && typeof report.data === 'object' 
                      ? Object.keys(report.data).length 
                      : 0;
                    
                    return (
                      <tr key={report.id} className="hover:bg-[#2A2B35] border-b border-[#333] transition-colors">
                        <td className="px-6 py-4 text-white font-mono">#{report.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{getDisplayTitle(report)}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            주간 기준: {new Date(report.weekStart).toLocaleDateString('ko-KR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs">
                            {customerCount}개 고객사
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-xs transition-colors"
                            onClick={() => router.push(`/admin/report/${report.id}`)}
                            data-testid={`report-detail-btn-${report.id}`}
                          >
                            📄 상세보기
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          💡 매주 월요일 08:30에 자동으로 새로운 보고서가 생성됩니다.
        </div>
      </div>
    </div>
  );
} 