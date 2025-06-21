/**
 * AI 서비스 목업 - 포트폴리오용 더미 데이터
 * 실제 OpenAI API 호출 없이 미리 생성된 응답을 반환
 */

// 더미 AI 응답 데이터베이스
const MOCK_SUMMARIES = {
  'AutoMaker': {
    summary: `AutoMaker 고객사의 주요 이슈 분석 결과:

1. **납기 지연 문제** (반복 8회)
   - 주요 원인: 글로벌 부품 공급망 불안정
   - 영향도: 높음 (평균 점수 4.2)

2. **품질 관리 이슈** (5건)
   - 도장 공정 불량률 증가
   - 고객 만족도 하락 우려

3. **설계 변경 요청** (3건)
   - 신규 안전 규정 대응
   - 프로세스 표준화 필요

4. **커뮤니케이션 개선 필요**
   - 담당자 변경으로 인한 정보 단절
   - 정기 미팅 체계 재구축 요구

5. **비용 최적화 압박**
   - 원자재 가격 상승 대응
   - 대체 공급사 검토 진행 중`,
    topIssues: [
      { title: '부품 공급 지연', plan: '대체 공급사 계약 검토', score: 4.5 },
      { title: '도장 품질 불량', plan: '공정 개선 회의 예정', score: 4.2 },
      { title: '설계 변경 대응', plan: '기술팀 추가 배정', score: 3.8 },
      { title: '커뮤니케이션 개선', plan: '주간 미팅 체계 도입', score: 3.5 },
      { title: '비용 절감 요구', plan: '원가 분석 보고서 작성', score: 3.2 }
    ]
  },
  'TechSupplier': {
    summary: `TechSupplier 고객사의 이슈 요약:

1. **기술 지원 요청 증가**
   - 신규 제품 도입 관련 문의
   - 기술 교육 프로그램 요청

2. **납기 일정 협의**
   - 프로젝트 일정 조정 필요
   - 우선순위 재조정 요구

3. **품질 기준 강화**
   - 새로운 테스트 프로토콜 적용
   - 인증 획득 지원 필요`,
    topIssues: [
      { title: '기술 교육 지원', plan: '전문가 파견 예정', score: 3.8 },
      { title: '납기 일정 조정', plan: '프로젝트 타임라인 재검토', score: 3.5 },
      { title: '품질 인증 지원', plan: '인증 컨설팅 제공', score: 3.2 }
    ]
  }
};

const MOCK_STRATEGIES = {
  'AutoMaker': {
    aiRecommendation: `[전략명]: 공급망 안정화 및 품질 개선 통합 전략
[대상]: AutoMaker 구매팀 및 품질관리팀
[요약]: 반복적인 납기 지연과 품질 이슈로 인한 고객 만족도 하락 우려. 근본적인 공급망 재구축과 품질 관리 체계 강화가 시급한 상황.
[조치]: 1) 핵심 부품 2차 공급사 확보, 2) 품질 게이트 검증 프로세스 도입, 3) 주간 진도 점검 회의 정례화
[예상 효과]: 납기 준수율 95% 달성, 품질 불량률 50% 감소, 고객 만족도 20% 향상 기대

[전략명]: 디지털 협업 플랫폼 구축
[대상]: 프로젝트 관리팀 및 고객사 담당자
[요약]: 담당자 변경과 정보 공유 부족으로 인한 커뮤니케이션 단절 문제 심화. 실시간 정보 공유 체계 필요.
[조치]: 1) 프로젝트 관리 툴 도입, 2) 실시간 진도 대시보드 구축, 3) 월간 스테이크홀더 미팅 개최
[예상 효과]: 정보 전달 오류 80% 감소, 의사결정 속도 30% 향상, 고객사 신뢰도 제고

[전략명]: 비용 최적화 및 가치 엔지니어링
[대상]: 설계팀 및 구매팀
[요약]: 원자재 가격 상승과 고객사의 비용 절감 압박으로 수익성 악화 우려. 가치 중심의 비용 관리 전략 필요.
[조치]: 1) VA/VE 분석을 통한 설계 최적화, 2) 장기 계약 기반 원가 안정화, 3) 고객사와 Win-Win 가격 모델 개발
[예상 효과]: 원가 절감 15% 달성, 고객 만족도 유지하며 수익성 개선, 장기 파트너십 강화`,
    parsedStrategy: {
      전략명: '공급망 안정화 및 품질 개선 통합 전략',
      대상: 'AutoMaker 구매팀 및 품질관리팀',
      요약: '반복적인 납기 지연과 품질 이슈로 인한 고객 만족도 하락 우려',
      조치: '핵심 부품 2차 공급사 확보, 품질 게이트 검증 프로세스 도입',
      예상효과: '납기 준수율 95% 달성, 품질 불량률 50% 감소 기대'
    }
  },
  'TechSupplier': {
    aiRecommendation: `[전략명]: 기술 파트너십 강화 전략
[대상]: TechSupplier 기술팀 및 교육팀
[요약]: 신규 제품 도입에 따른 기술 지원 요청 급증. 고객사의 기술 역량 강화를 통한 장기 파트너십 구축 기회.
[조치]: 1) 전담 기술 지원팀 구성, 2) 체계적 교육 프로그램 개발, 3) 기술 문서 표준화
[예상 효과]: 고객 기술 자립도 향상, 장기 계약 확보, 기술 협력 모델 확산

[전략명]: 프로젝트 관리 효율화
[대상]: 프로젝트 매니저 및 일정 관리팀
[요약]: 복수 프로젝트 동시 진행으로 인한 리소스 충돌과 일정 지연 발생. 체계적 우선순위 관리 필요.
[조치]: 1) 리소스 매트릭스 기반 일정 관리, 2) 마일스톤 기반 진도 추적, 3) 리스크 조기 경보 시스템 도입
[예상 효과]: 프로젝트 완료율 20% 향상, 고객사 신뢰도 증진, 수주 기회 확대`,
    parsedStrategy: {
      전략명: '기술 파트너십 강화 전략',
      대상: 'TechSupplier 기술팀 및 교육팀',
      요약: '신규 제품 도입에 따른 기술 지원 요청 급증',
      조치: '전담 기술 지원팀 구성, 체계적 교육 프로그램 개발',
      예상효과: '고객 기술 자립도 향상, 장기 계약 확보'
    }
  }
};

/**
 * 목업 AI 요약 생성
 * @param {Object} params - { customer, evidence, issues }
 * @returns {Object} - 요약 결과
 */
async function summary({ customer, evidence, issues }) {
  console.log(`🤖 [MOCK] GPT 요약 요청 - 고객사: ${customer}`);
  
  // 실제 API 호출 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 고객사에 따른 미리 정의된 응답 반환
  const mockData = MOCK_SUMMARIES[customer] || MOCK_SUMMARIES['AutoMaker'];
  
  console.log(`✅ [MOCK] GPT 요약 완료 - ${mockData.summary.length}자`);
  
  return {
    customer,
    summary: mockData.summary,
    evidence,
    issues: issues || [],
    topIssues: mockData.topIssues,
    generatedAt: new Date().toISOString(),
    _isMock: true
  };
}

/**
 * 목업 AI 전략 제언 생성
 * @param {Object} params - { customer, evidence, issues, summary }
 * @returns {Object} - 전략 제언 결과
 */
async function strategy({ customer, evidence, issues, summary }) {
  console.log(`🎯 [MOCK] GPT 전략 제언 요청 - 고객사: ${customer}`);
  
  // 실제 API 호출 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 고객사에 따른 미리 정의된 응답 반환
  const mockData = MOCK_STRATEGIES[customer] || MOCK_STRATEGIES['AutoMaker'];
  
  console.log(`✅ [MOCK] GPT 전략 제언 완료 - ${mockData.aiRecommendation.length}자`);
  
  return {
    customer,
    aiRecommendation: mockData.aiRecommendation,
    parsedStrategy: mockData.parsedStrategy,
    evidence,
    issues: issues || [],
    summary,
    generatedAt: new Date().toISOString(),
    _isMock: true
  };
}

/**
 * 추가 고객사를 위한 동적 목업 생성
 */
function generateDynamicMock(customer) {
  return {
    summary: `${customer} 고객사의 주요 이슈 분석:

1. **프로젝트 진행 현황**
   - 정상 진행 중인 항목들
   - 일부 일정 조정 필요

2. **커뮤니케이션 상태**
   - 정기 미팅 정상 운영
   - 피드백 반영 프로세스 원활

3. **품질 및 만족도**
   - 전반적으로 양호한 수준
   - 지속적인 개선 의지 확인`,
    topIssues: [
      { title: '일정 조정 요청', plan: '프로젝트 타임라인 검토', score: 3.0 },
      { title: '품질 개선 제안', plan: '개선 방안 수립', score: 2.8 },
      { title: '커뮤니케이션 최적화', plan: '미팅 주기 조정', score: 2.5 }
    ]
  };
}

module.exports = {
  summary,
  strategy,
  generateDynamicMock,
  MOCK_SUMMARIES,
  MOCK_STRATEGIES
}; 