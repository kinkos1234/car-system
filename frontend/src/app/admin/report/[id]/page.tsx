"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuthHeaders, isAuthenticated, getCurrentUser } from "@/utils/jwt";

interface WeeklyReport {
  id: number;
  title: string | null;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, any>;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

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
    
    loadReport();
  }, [params.id, router]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/report/weekly-reports/${params.id}`, {
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
        throw new Error(`Failed to load report: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error('Report load error:', err);
      setError(err.message || '보고서를 불러오는데 실패했습니다.');
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

  const getDisplayTitle = () => {
    if (!report) return '';
    if (report.title) return report.title;
    
    const date = new Date(report.createdAt);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `주간 요약 보고서_${year}${month}${day}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>보고서를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#181A20] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️ 보고서를 찾을 수 없습니다</div>
            <div className="text-gray-400 mb-6">{error}</div>
            <button
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              onClick={() => router.push("/admin/report")}
              data-testid="report-back-btn"
            >
              ← 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customers = report.data ? Object.keys(report.data) : [];

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{getDisplayTitle()}</h2>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>📅 생성일: {formatDate(report.createdAt)}</span>
              <span>📊 주간 기준: {new Date(report.weekStart).toLocaleDateString('ko-KR')}</span>
              <span>🏢 분석 고객사: {customers.length}개</span>
            </div>
          </div>
      <button
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2"
        onClick={() => router.push("/admin/report")}
        data-testid="report-back-btn"
          >
            ← 목록으로
          </button>
        </div>

        {/* 고객사 목록 (왼쪽 사이드바) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#23242B] rounded-lg border border-[#333] p-4 sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4">🏢 고객사 목록</h3>
              <div className="space-y-2">
                {customers.length === 0 ? (
                  <div className="text-gray-400 text-sm">분석된 고객사가 없습니다.</div>
                ) : (
                  customers.map((customer) => (
                    <button
                      key={customer}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                        selectedCustomer === customer
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#181A20] hover:bg-[#2A2B35] text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{customer}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {report.data[customer]?.summary?.totalEvents || 0}건 이벤트
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 상세 내용 (오른쪽 메인 영역) */}
          <div className="lg:col-span-3">
            {!selectedCustomer ? (
              <div className="bg-[#23242B] rounded-lg border border-[#333] p-12 text-center">
                <div className="text-gray-400 text-lg mb-4">👈 왼쪽에서 고객사를 선택하세요</div>
                <div className="text-gray-500 text-sm">선택한 고객사의 AI 분석 결과를 확인할 수 있습니다.</div>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const customerData = report.data[selectedCustomer];
                  if (!customerData) {
                    return (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
                        <div className="text-red-400">해당 고객사의 데이터를 찾을 수 없습니다.</div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* 고객사 헤더 */}
                      <div className="bg-[#23242B] rounded-lg border border-[#333] p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">🏢 {selectedCustomer}</h3>
                        
                        {/* 요약 통계 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-[#181A20] rounded-lg p-4 border border-[#444]">
                            <div className="text-xs text-gray-400 mb-1">총 이벤트</div>
                            <div className="text-xl font-bold text-blue-400">{customerData.summary?.totalEvents || 0}건</div>
                          </div>
                          <div className="bg-[#181A20] rounded-lg p-4 border border-[#444]">
                            <div className="text-xs text-gray-400 mb-1">최근 30일</div>
                            <div className="text-xl font-bold text-green-400">{customerData.summary?.recentEvents || 0}건</div>
                          </div>
                          <div className="bg-[#181A20] rounded-lg p-4 border border-[#444]">
                            <div className="text-xs text-gray-400 mb-1">미해결</div>
                            <div className="text-xl font-bold text-yellow-400">{customerData.summary?.openEvents || 0}건</div>
                          </div>
                          <div className="bg-[#181A20] rounded-lg p-4 border border-[#444]">
                            <div className="text-xs text-gray-400 mb-1">평균 Sentiment</div>
                            <div className="text-xl font-bold text-purple-400">{customerData.summary?.avgSentiment || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Evidence */}
                      <div className="bg-[#23242B] rounded-lg border border-[#333] p-6">
                        <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          📊 분석 근거 (Evidence)
                          <button
                            onClick={() => handleCopy(customerData.evidence || '')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-white transition-colors"
                          >
                            📋 복사
                          </button>
                        </h4>
                        <div className="bg-[#0A0B0F] rounded p-4 text-sm">
                          <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                            {customerData.evidence || '분석 근거 정보가 없습니다.'}
                          </pre>
                        </div>
                      </div>

                      {/* Top 이슈 */}
                      {customerData.topIssues && customerData.topIssues.length > 0 && (
                        <div className="bg-[#23242B] rounded-lg border border-[#333] p-6">
                          <h4 className="text-lg font-bold text-red-400 mb-4">🔥 주요 이슈 Top {customerData.topIssues.length}</h4>
                          <div className="space-y-4">
                            {customerData.topIssues.map((issue: any, idx: number) => (
                              <div key={idx} className="bg-[#0A0B0F] rounded p-4 border-l-4 border-red-500">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 mr-4">
                                    <div className="font-medium text-white text-sm leading-relaxed whitespace-pre-wrap">
                                      {issue.title}
                                    </div>
                                  </div>
                                  <span className="text-red-400 font-bold text-sm flex-shrink-0">{issue.score}</span>
                                </div>
                                <div className="text-xs text-gray-400 leading-relaxed">
                                  <span className="text-gray-500">📋 조치계획:</span>
                                  <div className="mt-1 whitespace-pre-wrap text-gray-300 leading-relaxed">
                                    {issue.plan}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI 전략 제언 */}
                      <div className="bg-[#23242B] rounded-lg border border-[#333] p-6">
                        <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                          🎯 AI 전략 제언
                          <button
                            onClick={() => handleCopy(customerData.aiRecommendation || '')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                          >
                            📋 복사
                          </button>
                        </h4>
                        
                        <div className="bg-[#0A0B0F] rounded p-4 text-sm mb-4">
                          <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                            {customerData.aiRecommendation || '전략 제언이 생성되지 않았습니다.'}
                          </pre>
                        </div>

                        {/* 구조화된 전략 */}
                        {customerData.parsedStrategy && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(customerData.parsedStrategy).map(([key, value]: [string, any]) => (
                              <div key={key} className="bg-[#0A0B0F] rounded p-4 border border-[#444]">
                                <div className="text-xs text-gray-400 mb-2">{key}</div>
                                <div className="text-sm text-white">{value || '-'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 오류 정보 */}
                      {customerData.errors && (customerData.errors.summaryError || customerData.errors.strategyError) && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
                          <h4 className="text-red-400 font-bold mb-3">⚠️ 생성 중 발생한 오류</h4>
                          {customerData.errors.summaryError && (
                            <div className="text-sm text-red-300 mb-2">
                              📄 요약 오류: {customerData.errors.summaryError}
                            </div>
                          )}
                          {customerData.errors.strategyError && (
                            <div className="text-sm text-red-300">
                              🎯 전략 제언 오류: {customerData.errors.strategyError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 생성 정보 */}
                      <div className="bg-[#181A20] rounded-lg border border-[#333] p-4 text-center">
                        <div className="text-xs text-gray-400">
                          🤖 AI 분석 완료: {new Date(customerData.generatedAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 