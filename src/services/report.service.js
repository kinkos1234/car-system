require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const aiService = require('./ai.service');
const prisma = new PrismaClient();

async function getLatest(filter = {}) {
  // 최신 주간 보고서 1건 + 필터 적용(고객사, 부서 등)
  const report = await prisma.weeklyReport.findFirst({
    orderBy: { weekStart: 'desc' },
  });
  if (!report) return null;
  // 필터 적용: data(JSON)에서 subset 추출(간단화)
  let data = report.data;
  if (filter.corp) data = { [filter.corp]: data[filter.corp] };
  if (filter.customer) data = Object.fromEntries(Object.entries(data).filter(([k]) => k === filter.customer));
  // 기타 필터는 실제 구조에 맞게 확장
  return { ...report, data };
}

async function generateReport() {
  return await generateWeeklyReport();
}

async function generateWeeklyReport(progressCallback = null) {
  console.log('🚀 AI 기반 주간 보고서 생성 시작...');
  
  try {
    // 초기 진행 상황 업데이트
    if (progressCallback) {
      progressCallback({
        currentStep: 'loading_data',
        totalCompanies: 0,
        completedCompanies: 0,
        currentCompany: '데이터 로딩 중...'
      });
    }

    // 1. 전체 CAR 이력 조회 (고객사 정보 포함)
    const allCars = await prisma.cAR.findMany({
      include: {
        creator: true,
        scoreHistories: true,
        carCustomerContacts: {
          include: {
            CustomerContact: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 총 ${allCars.length}건의 CAR 데이터 로드 완료`);
    
    // 2. 고객사별 그룹핑
    const customerGroups = {};
    
    for (const car of allCars) {
      // 고객사명 추출 (첫 번째 고객 담당자의 group 사용)
      const customer = car.carCustomerContacts?.[0]?.CustomerContact?.group || '고객사 미지정';
      if (!customerGroups[customer]) {
        customerGroups[customer] = {
          allHistory: [],
          recent30Days: [],
          openIssues: []
        };
      }
      
      customerGroups[customer].allHistory.push(car);
      
      // 최근 30일 데이터 필터링
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (new Date(car.createdAt) >= thirtyDaysAgo || !car.completionDate) {
        customerGroups[customer].recent30Days.push(car);
      }
      
      // 미종결 이슈 필터링
      if (!car.completionDate) {
        customerGroups[customer].openIssues.push(car);
      }
    }
    
    const totalCompanies = Object.keys(customerGroups).length;
    console.log(`👥 ${totalCompanies}개 고객사 그룹핑 완료`);
    
    // 그룹핑 완료 후 진행 상황 업데이트
    if (progressCallback) {
      progressCallback({
        currentStep: 'analyzing',
        totalCompanies: totalCompanies,
        completedCompanies: 0,
        currentCompany: '분석 준비 중...'
      });
    }
    
    // 3. 고객사별 AI 분석 실행
    const reportData = {};
    let completedCompanies = 0;
    
    for (const [customer, data] of Object.entries(customerGroups)) {
      console.log(`\n🔄 ${customer} 고객사 AI 분석 시작...`);
      
      // 현재 고객사 처리 중 상태 업데이트
      if (progressCallback) {
        progressCallback({
          currentStep: 'analyzing',
          totalCompanies: totalCompanies,
          completedCompanies: completedCompanies,
          currentCompany: customer
        });
      }
      
      try {
        // 3-1. Evidence(근거) 생성 - 서버 전처리
        const evidence = generateEvidence(data.allHistory);
        
        // 3-2. 최근 30일 + 미종결 이슈 데이터 준비
        const recentIssues = [...data.recent30Days, ...data.openIssues]
          .filter((car, index, arr) => arr.findIndex(c => c.id === car.id) === index) // 중복 제거
          .map(car => ({
            title: car.openIssue || '이슈 제목 없음',
            plan: car.followUpPlan || '조치 계획 없음',
            score: car.score || 0,
            importance: car.importance || 1,
            openIssue: car.openIssue,
            followUpPlan: car.followUpPlan,
            createdAt: car.createdAt,
            dueDate: car.dueDate,
            completionDate: car.completionDate
          }));
        
        console.log(`📝 ${customer}: Evidence 생성 완료, 최근 이슈 ${recentIssues.length}건 준비`);
        
        // 3-3. GPT-3.5로 요약 생성
        const summaryResult = await aiService.summary({
          customer,
          evidence,
          issues: recentIssues
        });
        
        console.log(`📄 ${customer}: GPT-3.5 요약 완료`);
        
        // 3-4. GPT-4o로 전략 제언 생성
        const strategyResult = await aiService.strategy({
          customer,
          evidence,
          issues: recentIssues,
          summary: summaryResult.summary
        });
        
        console.log(`🎯 ${customer}: GPT-4o 전략 제언 완료`);
        
        // 3-5. 결과 구조화
        reportData[customer] = {
          evidence,
          summary: {
            totalEvents: data.allHistory.length,
            recentEvents: data.recent30Days.length,
            openEvents: data.openIssues.length,
            avgSentiment: calculateAvgSentiment(data.allHistory),
            scoreSum: data.allHistory.reduce((sum, car) => sum + (car.score || 0), 0)
          },
          topIssues: summaryResult.topIssues || [],
          aiRecommendation: strategyResult.aiRecommendation,
          parsedStrategy: strategyResult.parsedStrategy,
          generatedAt: new Date().toISOString(),
          errors: {
            summaryError: summaryResult.error || null,
            strategyError: strategyResult.error || null
          }
        };
        
        console.log(`✅ ${customer}: AI 분석 완료`);
        
      } catch (error) {
        console.error(`❌ ${customer} AI 분석 실패:`, error.message);
        
        // 실패 시 fallback 데이터
        reportData[customer] = {
          evidence: `${customer} 고객사의 전체 이력 분석 실패`,
          summary: {
            totalEvents: data.allHistory.length,
            recentEvents: data.recent30Days.length,
            openEvents: data.openIssues.length,
            avgSentiment: calculateAvgSentiment(data.allHistory),
            scoreSum: data.allHistory.reduce((sum, car) => sum + (car.score || 0), 0)
          },
          topIssues: data.allHistory.slice(0, 5).map(car => ({
            title: car.openIssue || '제목 없음',
            plan: car.followUpPlan || '계획 없음',
            score: car.score || 0
          })),
          aiRecommendation: `${customer} 고객사에 대한 AI 분석이 실패했습니다. 시스템 관리자에게 문의하시기 바랍니다.`,
          parsedStrategy: {
            전략명: 'AI 분석 실패',
            대상: customer,
            요약: 'AI 시스템 오류 발생',
            조치: '시스템 관리자 문의 필요',
            '예상 효과': '정상 서비스 복구'
          },
          generatedAt: new Date().toISOString(),
          errors: {
            summaryError: error.message,
            strategyError: error.message
          }
        };
      }

      // 고객사 처리 완료 후 진행 상황 업데이트
      completedCompanies++;
      if (progressCallback) {
        progressCallback({
          currentStep: 'analyzing',
          totalCompanies: totalCompanies,
          completedCompanies: completedCompanies,
          currentCompany: completedCompanies < totalCompanies ? '다음 고객사 처리 중...' : '분석 완료'
        });
      }
    }
    
    // 4. 보고서 제목 생성 [주간 요약 보고서_AI분석_yymmdd-##]
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 오늘 날짜가 포함된 보고서 제목 패턴으로 검색하여 번호 계산
    const datePattern = `${year}${month}${day}`;
    const existingReports = await prisma.weeklyReport.findMany({
      where: {
        title: {
          contains: `_AI분석_${datePattern}-`
        }
      },
      select: {
        title: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 기존 보고서들에서 최대 번호 찾기
    let maxNumber = 0;
    existingReports.forEach(report => {
      const match = report.title.match(new RegExp(`_AI분석_${datePattern}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const reportNumber = String(maxNumber + 1).padStart(2, '0');
    const reportTitle = `주간 요약 보고서_AI분석_${year}${month}${day}-${reportNumber}`;

    // 5. DB에 저장
    if (progressCallback) {
      progressCallback({
        currentStep: 'saving',
        totalCompanies: totalCompanies,
        completedCompanies: completedCompanies,
        currentCompany: '데이터베이스 저장 중...'
      });
    }

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0); // 주 시작일로 정규화
    
    // 매번 새로운 보고서 생성 (upsert 제거)
    const report = await prisma.weeklyReport.create({
      data: {
        title: reportTitle,
        weekStart, 
        data: reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 최종 완료 상태 업데이트
    if (progressCallback) {
      progressCallback({
        currentStep: 'completed',
        totalCompanies: totalCompanies,
        completedCompanies: completedCompanies,
        currentCompany: `보고서 생성 완료 (ID: ${report.id})`
      });
    }
    
    console.log(`🎉 AI 기반 주간 보고서 생성 완료 - ${Object.keys(reportData).length}개 고객사`);
    
    return report;
    
  } catch (error) {
    console.error('❌ AI 기반 주간 보고서 생성 실패:', error);
    throw error;
  }
}

/**
 * Evidence(근거) 생성 - 서버 전처리
 */
function generateEvidence(allHistory) {
  if (!allHistory || allHistory.length === 0) {
    return "분석할 이력이 없습니다.";
  }
  
  // 반복 이슈 분석
  const issueFrequency = {};
  const longUnresolvedIssues = [];
  
  allHistory.forEach(car => {
    const issue = car.openIssue || '기타';
    issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    
    // 30일 이상 미해결 이슈 (BigInt 처리)
    if (!car.completionDate && car.dueDate) {
      const dueDateNum = typeof car.dueDate === 'bigint' ? Number(car.dueDate) : car.dueDate;
      const diffDays = Math.floor((new Date() - new Date(dueDateNum)) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        longUnresolvedIssues.push(issue);
      }
    }
  });
  
  // 반복 이슈 Top 3
  const repeatedIssues = Object.entries(issueFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([issue, count]) => `${issue}(${count}회)`);
  
  // 트렌드 분석 (간단화) - BigInt 처리
  const recentMonth = allHistory.filter(car => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const createdAtNum = typeof car.createdAt === 'bigint' ? Number(car.createdAt) : car.createdAt;
    return new Date(createdAtNum) >= monthAgo;
  });
  
  const avgRecentScore = recentMonth.length > 0 
    ? recentMonth.reduce((sum, car) => sum + (car.score || 0), 0) / recentMonth.length 
    : 0;
  
  const trend = avgRecentScore > 3 ? "최근 이슈 심각도 증가" : "최근 이슈 안정적 관리";
  
  return `전체 이력 ${allHistory.length}건 분석 결과:\n` +
         `- 반복 이슈: ${repeatedIssues.join(', ')}\n` +
         `- 장기 미해결: ${longUnresolvedIssues.slice(0, 3).join(', ') || '없음'}\n` +
         `- 최근 트렌드: ${trend} (평균 점수: ${avgRecentScore.toFixed(1)})`;
}

/**
 * 평균 감성 점수 계산
 */
function calculateAvgSentiment(cars) {
  if (!cars || cars.length === 0) return 0;
  
  const sentimentCars = cars.filter(car => car.sentimentScore != null);
  if (sentimentCars.length === 0) return 0;
  
  const sum = sentimentCars.reduce((total, car) => total + car.sentimentScore, 0);
  return Math.round(sum / sentimentCars.length * 10) / 10; // 소수점 1자리
}

// 주간 보고서 목록 조회 (최신순)
async function getWeeklyReports() {
  try {
    const reports = await prisma.weeklyReport.findMany({
      select: {
        id: true,
        title: true,
        weekStart: true,
        data: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // BigInt를 문자열로 변환하여 JSON 직렬화 가능하게 처리
    const { convertBigIntToString } = require('../utils/bigint');
    return convertBigIntToString(reports);
  } catch (error) {
    console.error('❌ 주간 보고서 목록 조회 실패:', error);
    throw error;
  }
}

// 주간 보고서 단일 조회
async function getWeeklyReportById(id) {
  try {
    const report = await prisma.weeklyReport.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        weekStart: true,
        data: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!report) return null;

    // BigInt를 문자열로 변환하여 JSON 직렬화 가능하게 처리
    const { convertBigIntToString } = require('../utils/bigint');
    return convertBigIntToString(report);
  } catch (error) {
    console.error('❌ 주간 보고서 조회 실패:', error);
    throw error;
  }
}

module.exports = { getLatest, generateReport, generateWeeklyReport, getWeeklyReports, getWeeklyReportById }; 