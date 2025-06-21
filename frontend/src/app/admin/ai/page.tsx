"use client";
import { useState, useEffect } from "react";

interface ProgressInfo {
  currentStep: string;
  totalCompanies: number;
  completedCompanies: number;
  currentCompany: string;
}

interface JobStatus {
  id: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  progress: ProgressInfo;
  result?: any;
  error?: string;
  duration: number;
}

export default function AIPage() {
  const [loading, setLoading] = useState(false);
  const [mailing, setMailing] = useState(false);
  const [summaryResult, setSummaryResult] = useState("");
  const [strategyResult, setStrategyResult] = useState("");
  const [error, setError] = useState("");
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  
  // 비동기 작업 상태 관리
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const handleAIRequest = async () => {
    setLoading(true);
    setError("");
    
    try {
      // 테스트 데이터
      const testData = {
        customer: 'TESLA',
        evidence: '전체 이력 25건 분석 결과:\n- 반복 이슈: 납기 지연(8회), 품질 불만(5회), 설계 변경(3회)\n- 장기 미해결: 도장 공정 문제\n- 최근 트렌드: 최근 이슈 심각도 증가 (평균 점수: 4.2)',
        issues: [
          { title: '납기 지연 문제', plan: '공급업체 교체 검토', score: 4.5 },
          { title: '품질 불량 증가', plan: '품질 관리 강화', score: 3.8 },
          { title: '설계 변경 요청', plan: '설계팀 미팅 예정', score: 3.2 }
        ]
      };

      // 1. AI 요약 테스트
      console.log('📄 AI 요약 요청...');
      const summaryResponse = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(testData)
      });
      
      if (!summaryResponse.ok) {
        throw new Error(`요약 API 호출 실패: ${summaryResponse.status}`);
      }
      
      const summaryData = await summaryResponse.json();
      setSummaryResult(summaryData.summary || "요약 결과 없음");
      
      // 2. AI 전략 제언 테스트
      console.log('🎯 AI 전략 제언 요청...');
      const strategyResponse = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...testData,
          summary: summaryData.summary
        })
      });
      
      if (!strategyResponse.ok) {
        throw new Error(`전략 제언 API 호출 실패: ${strategyResponse.status}`);
      }
      
      const strategyData = await strategyResponse.json();
      setStrategyResult(strategyData.aiRecommendation || "전략 제언 결과 없음");
      
      alert("🎉 AI 분석이 완료되었습니다!");
      
    } catch (error: any) {
      console.error('AI 분석 실패:', error);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
      alert(`❌ AI 분석 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 작업 상태 폴링
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/report/jobs/${jobId}/status`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentJob(data.job);
          
          // 작업 완료 또는 실패 시 폴링 중지
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            setIsPolling(false);
            setLoading(false);
            
            if (data.job.status === 'completed') {
              alert(`✅ AI 보고서 생성이 완료되었습니다!\n보고서 ID: ${data.job.result?.id}\n소요 시간: ${Math.round(data.job.duration / 60)}분`);
            } else {
              alert(`❌ AI 보고서 생성이 실패했습니다.\n오류: ${data.job.error}`);
            }
          }
        }
      } else if (response.status === 404 || response.status === 410) {
        // 작업이 없거나 만료된 경우
        setIsPolling(false);
        setLoading(false);
        setCurrentJob(null);
      }
    } catch (error) {
      console.error('작업 상태 조회 실패:', error);
    }
  };

  // 폴링 실행
  useEffect(() => {
    if (isPolling && currentJob?.id) {
      const interval = setInterval(() => {
        pollJobStatus(currentJob.id);
      }, 2000); // 2초마다 상태 확인

      return () => clearInterval(interval);
    }
  }, [isPolling, currentJob?.id]);

  // 비동기 보고서 생성
  const handleGenerateReportAsync = async () => {
    setLoading(true);
    setError("");
    setCurrentJob(null);
    
    try {
      console.log('📊 비동기 주간 보고서 생성 요청...');
      
      const response = await fetch('/api/report/generate-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`보고서 생성 API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('비동기 보고서 생성 시작:', result);
      
      if (result.success && result.jobId) {
        // 작업 시작 상태 설정
        setCurrentJob({
          id: result.jobId,
          status: 'started',
          startTime: new Date().toISOString(),
          progress: {
            currentStep: 'initializing',
            totalCompanies: 0,
            completedCompanies: 0,
            currentCompany: '작업 시작 중...'
          },
          duration: 0
        });
        
        // 폴링 시작
        setIsPolling(true);
        
        alert(`🚀 ${result.message}\n작업 ID: ${result.jobId}\n${result.estimatedDuration}`);
      } else {
        throw new Error(result.message || '작업 시작 실패');
      }
      
    } catch (error: any) {
      console.error('비동기 보고서 생성 실패:', error);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
      setLoading(false);
      alert(`❌ 보고서 생성 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleSendMail = async () => {
    setMailing(true);
    setError("");
    
    try {
      console.log('📧 주간 보고서 이메일 발송 요청...');
      
      const response = await fetch('/api/report/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `API 호출 실패: ${response.status}`);
      }
      
      if (result.success) {
        const data = result.data || {};
        alert(`✅ 주간 보고서 이메일 발송 완료!

📊 보고서: ${data.reportTitle || 'N/A'}
📫 총 발송 대상: ${data.recipientCount || 0}명
✅ 성공: ${data.successCount || 0}건
❌ 실패: ${data.failCount || 0}건

${result.message}`);
      } else {
        throw new Error(result.message || '이메일 발송 실패');
      }
      
    } catch (error: any) {
      console.error('이메일 발송 실패:', error);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
      alert(`❌ 이메일 발송 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setMailing(false);
    }
  };

  // 스케줄러 상태 조회
  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/report/scheduler/status', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setSchedulerStatus(status);
      }
    } catch (error) {
      console.error('스케줄러 상태 조회 실패:', error);
    }
  };

  // 스케줄러 시작
  const handleStartScheduler = async () => {
    setSchedulerLoading(true);
    try {
      const response = await fetch('/api/report/scheduler/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadSchedulerStatus();
      } else {
        throw new Error('스케줄러 시작 실패');
      }
    } catch (error: any) {
      alert(`❌ 스케줄러 시작 실패: ${error.message}`);
    } finally {
      setSchedulerLoading(false);
    }
  };

  // 스케줄러 중지
  const handleStopScheduler = async () => {
    setSchedulerLoading(true);
    try {
      const response = await fetch('/api/report/scheduler/stop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadSchedulerStatus();
      } else {
        throw new Error('스케줄러 중지 실패');
      }
    } catch (error: any) {
      alert(`❌ 스케줄러 중지 실패: ${error.message}`);
    } finally {
      setSchedulerLoading(false);
    }
  };

  // 수동 보고서 생성 - 비동기 방식으로 변경
  const handleManualReport = async () => {
    await handleGenerateReportAsync();
  };

  // 기존 동기 방식 보고서 생성 (백업용)
  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('📊 주간 보고서 생성 요청 (동기)...');
      const response = await fetch('/api/report/weekly/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        // 타임아웃 15분으로 설정
      });
      
      if (!response.ok) {
        throw new Error(`보고서 생성 API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('보고서 생성 결과:', result);
      
      alert("📈 AI 기반 주간 보고서가 생성되었습니다!");
      
    } catch (error: any) {
      console.error('보고서 생성 실패:', error);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
      alert(`❌ 보고서 생성 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 진행 단계 표시 함수
  const getStepText = (step: string) => {
    switch (step) {
      case 'initializing': return '🔄 초기화 중';
      case 'loading_data': return '📊 데이터 로딩 중';
      case 'analyzing': return '🤖 AI 분석 중';
      case 'saving': return '💾 저장 중';
      case 'completed': return '✅ 완료';
      case 'failed': return '❌ 실패';
      default: return step;
    }
  };

  // 진행률 계산
  const getProgressPercentage = () => {
    if (!currentJob?.progress) return 0;
    
    const { currentStep, totalCompanies, completedCompanies } = currentJob.progress;
    
    if (currentStep === 'initializing') return 5;
    if (currentStep === 'loading_data') return 10;
    if (currentStep === 'analyzing') {
      if (totalCompanies === 0) return 15;
      const baseProgress = 15;
      const analyzeProgress = (completedCompanies / totalCompanies) * 70; // 70%는 분석 단계
      return Math.min(baseProgress + analyzeProgress, 85);
    }
    if (currentStep === 'saving') return 90;
    if (currentStep === 'completed') return 100;
    
    return 0;
  };

  // 컴포넌트 마운트 시 스케줄러 상태 조회
  useEffect(() => {
    loadSchedulerStatus();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[#0A0B0F] text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-center">🤖 AI 분석 및 보고서 생성</h2>
      
      {/* 진행 상황 표시 */}
      {currentJob && (
        <div className="mb-6 bg-[#181A20] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-blue-400">📊 보고서 생성 진행 상황</h3>
          
          <div className="space-y-4">
            {/* 작업 정보 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">작업 ID:</span>
                <span className="ml-2 font-mono text-gray-300">{currentJob.id}</span>
              </div>
              <div>
                <span className="text-gray-400">상태:</span>
                <span className={`ml-2 font-bold ${
                  currentJob.status === 'completed' ? 'text-green-400' :
                  currentJob.status === 'failed' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {currentJob.status === 'started' ? '시작됨' :
                   currentJob.status === 'in_progress' ? '진행 중' :
                   currentJob.status === 'completed' ? '완료' :
                   currentJob.status === 'failed' ? '실패' : currentJob.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400">소요 시간:</span>
                <span className="ml-2 text-gray-300">{Math.round(currentJob.duration / 60)}분 {currentJob.duration % 60}초</span>
              </div>
              <div>
                <span className="text-gray-400">현재 단계:</span>
                <span className="ml-2 text-gray-300">{getStepText(currentJob.progress.currentStep)}</span>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-[#0A0B0F] rounded-full h-3 border border-[#444]">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-400">
              {getProgressPercentage().toFixed(1)}% 완료
            </div>

            {/* 현재 처리 중인 정보 */}
            {currentJob.progress.totalCompanies > 0 && (
              <div className="bg-[#0A0B0F] rounded p-3 border border-[#444]">
                <div className="text-sm text-gray-400 mb-1">고객사 분석 진행</div>
                <div className="text-gray-300">
                  {currentJob.progress.completedCompanies} / {currentJob.progress.totalCompanies} 완료
                </div>
                <div className="text-sm text-blue-400 mt-1">
                  현재: {currentJob.progress.currentCompany}
                </div>
              </div>
            )}

            {/* 오류 정보 */}
            {currentJob.error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
                <div className="text-red-400 font-bold">❌ 오류 발생</div>
                <div className="text-red-300 text-sm mt-1">{currentJob.error}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 버튼 그룹 */}
      <div className="flex gap-3 mb-8 justify-center flex-wrap">
        <button
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          onClick={handleAIRequest}
          disabled={loading}
          data-testid="ai-analyze-btn"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              AI 분석 중...
            </>
          ) : (
            <>
              📄 AI 분석 테스트
            </>
          )}
        </button>
        
        <button
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          onClick={handleGenerateReportAsync}
          disabled={loading || isPolling}
        >
          {loading || isPolling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {isPolling ? '생성 진행 중...' : '보고서 생성 중...'}
            </>
          ) : (
            <>
              📊 주간 보고서 생성
            </>
          )}
        </button>
        
        <button
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          onClick={handleGenerateReport}
          disabled={loading || isPolling}
          title="기존 동기 방식 (백업용)"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              보고서 생성 중...
            </>
          ) : (
            <>
              📊 동기식 생성
            </>
          )}
        </button>
        
        <button
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          onClick={handleSendMail}
          disabled={mailing}
          data-testid="ai-mail-btn"
        >
          {mailing ? "메일 발송 중..." : "📧 메일로 결과 전송"}
        </button>
      </div>

      {/* 오류 표시 */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <h3 className="text-red-400 font-bold mb-2">❌ 오류 발생</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* 결과 표시 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI 요약 결과 */}
        <div className="bg-[#181A20] border border-[#333] rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-blue-400">📄 요약 결과</h3>
          <div className="bg-[#0A0B0F] p-4 rounded border border-[#444] min-h-[200px]">
            {summaryResult ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                {summaryResult}
              </pre>
            ) : (
              <p className="text-gray-500 italic">AI 분석 테스트 버튼을 클릭하여 요약을 생성하세요.</p>
            )}
          </div>
        </div>

        {/* AI 전략 제언 결과 */}
        <div className="bg-[#181A20] border border-[#333] rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-green-400">🎯 전략 제언 결과</h3>
          <div className="bg-[#0A0B0F] p-4 rounded border border-[#444] min-h-[200px]">
            {strategyResult ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                {strategyResult}
              </pre>
            ) : (
              <p className="text-gray-500 italic">AI 분석 테스트 버튼을 클릭하여 전략 제언을 생성하세요.</p>
            )}
          </div>
        </div>
      </div>

      {/* 스케줄러 관리 섹션 */}
      <div className="mt-8 bg-[#181A20] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-orange-400">⏰ 자동 스케줄러 관리</h3>
        
        {schedulerStatus ? (
          <div className="space-y-4">
            {/* 스케줄러 상태 표시 */}
            <div className="bg-[#0A0B0F] rounded-lg p-4 border border-[#444]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">상태</div>
                  <div className={`text-sm font-bold ${schedulerStatus.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                    {schedulerStatus.isRunning ? '🟢 실행 중' : '🔴 중지됨'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">스케줄</div>
                  <div className="text-sm text-gray-300">{schedulerStatus.description}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Cron 표현식</div>
                  <div className="text-sm text-gray-300 font-mono">{schedulerStatus.cronExpression}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">다음 실행 예정</div>
                  <div className="text-sm text-gray-300">
                    {schedulerStatus.nextRun 
                      ? new Date(schedulerStatus.nextRun).toLocaleString('ko-KR')
                      : '스케줄러가 중지됨'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* 스케줄러 제어 버튼 */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleStartScheduler}
                disabled={schedulerLoading || schedulerStatus.isRunning}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {schedulerLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    ▶️ 스케줄러 시작
                  </>
                )}
              </button>
              
              <button
                onClick={handleStopScheduler}
                disabled={schedulerLoading || !schedulerStatus.isRunning}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {schedulerLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    ⏹️ 스케줄러 중지
                  </>
                )}
              </button>
              
              <button
                onClick={handleManualReport}
                disabled={loading || isPolling}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {loading || isPolling ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isPolling ? '생성 진행 중...' : '생성 중...'}
                  </>
                ) : (
                  <>
                    🚀 수동 보고서 생성 (비동기)
                  </>
                )}
              </button>
              
              <button
                onClick={loadSchedulerStatus}
                disabled={schedulerLoading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
              >
                🔄 상태 새로고침
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0B0F] rounded-lg p-4 border border-[#444] text-center">
            <div className="text-gray-400">스케줄러 상태를 불러오는 중...</div>
          </div>
        )}
      </div>

      {/* 사용 안내 */}
      <div className="mt-8 bg-[#181A20] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-3 text-yellow-400">🛠️ 사용 안내</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• <strong>AI 분석 테스트:</strong> TESLA 고객사 샘플 데이터로 요약 + 전략 제언 테스트</li>
          <li>• <strong>주간 보고서 생성 (비동기):</strong> 백그라운드에서 AI 분석 실행, 실시간 진행 상황 표시</li>
          <li>• <strong>주간 보고서 생성 (동기):</strong> 기존 방식, 완료까지 대기 (백업용)</li>
          <li>• <strong>메일 전송:</strong> 최신 주간 보고서를 이메일 수신 설정된 사용자들에게 자동 발송</li>
          <li>• <strong>자동 스케줄러:</strong> 매주 월요일 08:30에 자동으로 AI 보고서 생성 및 이메일 발송</li>
          <li>• <strong>예상 소요 시간:</strong> 약 3-5분</li>
          <li>• API 키: .env 파일에 등록</li>
        </ul>
      </div>
    </div>
  );
} 