const OpenAI = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

/**
 * GPT-3.5를 사용한 이슈 요약 생성
 * @param {Object} params - { customer, evidence, issues }
 * @returns {Object} - 요약 결과
 */
async function summary({ customer, evidence, issues }) {
  try {
    console.log(`🤖 GPT-3.5 요약 요청 시작 - 고객사: ${customer}, 이슈 개수: ${issues?.length || 0}`);
    
    // 프롬프트 구성
    const prompt = buildSummaryPrompt(customer, evidence, issues);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 고객 관계 관리(CAR) 전문가입니다. 제공된 이슈들을 간결하고 명확하게 요약하여 핵심 포인트만 추출해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3 // 일관성 있는 요약을 위해 낮은 창의성
    });

    const summaryText = response.choices[0]?.message?.content?.trim() || "요약 생성 실패";
    
    console.log(`✅ GPT-3.5 요약 완료 - ${summaryText.length}자`);
    
    return {
      customer,
      summary: summaryText,
      evidence,
      issues,
      topIssues: extractTopIssues(summaryText, issues),
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ GPT-3.5 요약 실패:`, error.message);
    
    // 실패 시 fallback 처리
    const fallbackSummary = generateFallbackSummary(customer, issues);
    
    return {
      customer,
      summary: fallbackSummary,
      evidence,
      issues,
      topIssues: issues?.slice(0, 5) || [],
      error: "AI 요약 생성 실패 - fallback 적용",
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * GPT-4o를 사용한 전략 제언 생성
 * @param {Object} params - { customer, evidence, issues, summary }
 * @returns {Object} - 전략 제언 결과
 */
async function strategy({ customer, evidence, issues, summary }) {
  try {
    console.log(`🎯 GPT-4o 전략 제언 요청 시작 - 고객사: ${customer}`);
    
    // 프롬프트 구성
    const prompt = buildStrategyPrompt(customer, evidence, issues, summary);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4o 모델 사용
      messages: [
        {
          role: "system",
          content: "당신은 전략적 고객 관계 컨설턴트입니다. 제공된 정보를 바탕으로 실질적이고 구체적인 전략 제언을 5개 항목으로 구조화하여 제시해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.4 // 창의적이지만 일관성 있는 제언
    });

    const recommendationText = response.choices[0]?.message?.content?.trim() || "전략 제언 생성 실패";
    
    console.log(`✅ GPT-4o 전략 제언 완료 - ${recommendationText.length}자`);
    
    // 전략 제언을 구조화된 형태로 파싱
    const parsedRecommendation = parseStrategyRecommendation(recommendationText);
    
    return {
      customer,
      aiRecommendation: recommendationText,
      parsedStrategy: parsedRecommendation,
      evidence,
      issues,
      summary,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ GPT-4o 전략 제언 실패:`, error.message);
    
    // 실패 시 fallback 처리
    const fallbackStrategy = generateFallbackStrategy(customer, issues);
    
    return {
      customer,
      aiRecommendation: fallbackStrategy.text,
      parsedStrategy: fallbackStrategy.parsed,
      evidence,
      issues,
      summary,
      error: "AI 전략 제언 생성 실패 - fallback 적용",
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * GPT-3.5 요약용 프롬프트 구성
 */
function buildSummaryPrompt(customer, evidence, issues) {
  let prompt = `아래는 고객사 ${customer}의 전체 이력 기반 요약(근거)과 최근 30일+미종결 CAR 상세 목록입니다.\n\n`;
  
  // Evidence 추가
  if (evidence) {
    prompt += `[전체 이력 기반 요약]\n${evidence}\n\n`;
  }
  
  // 상세 이슈 추가
  if (issues && issues.length > 0) {
    prompt += `[최근 30일+미종결 상세]\n`;
    issues.slice(0, 10).forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.title || issue.openIssue || '제목 없음'}\n`;
      if (issue.plan || issue.followUpPlan) {
        prompt += `   조치계획: ${issue.plan || issue.followUpPlan}\n`;
      }
      if (issue.score !== undefined) {
        prompt += `   점수: ${issue.score}\n`;
      }
      prompt += '\n';
    });
  }
  
  prompt += `\n위 내용을 바탕으로 핵심 이슈를 5개 이내로 요약해 주세요.\n`;
  prompt += `(불필요한 반복/상투적 문구 제거, 1,500자 이내)`;
  
  return prompt;
}

/**
 * GPT-4o 전략 제언용 프롬프트 구성
 */
function buildStrategyPrompt(customer, evidence, issues, summary) {
  let prompt = `아래는 고객사 ${customer}의 전체 이력 요약(근거)와 최근 30일+미종결 이슈 요약입니다.\n\n`;
  
  if (evidence) {
    prompt += `[근거 요약]\n${evidence}\n\n`;
  }
  
  if (summary) {
    prompt += `[이슈 요약]\n${summary}\n\n`;
  }
  
  prompt += `다음 5개 항목으로 구체적인 전략 제언을 제시해 주세요:\n\n`;
  prompt += `[전략명]: (전략의 핵심 명칭)\n`;
  prompt += `[대상]: (적용 대상)\n`;
  prompt += `[요약]: (현재 상황 요약)\n`;
  prompt += `[조치]: (구체적 실행 방안)\n`;
  prompt += `[예상 효과]: (기대되는 결과)\n\n`;
  prompt += `각 항목은 2~3문장 이내로 명확하고 실질적인 조언 위주로 작성해 주세요.`;
  
  return prompt;
}

/**
 * Top 5 이슈 추출
 */
function extractTopIssues(summaryText, issues) {
  if (!issues || issues.length === 0) return [];
  
  // 점수 기준으로 정렬하여 상위 5개 추출
  const sortedIssues = [...issues]
    .filter(issue => issue.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);
  
  return sortedIssues.map(issue => ({
    title: issue.title || issue.openIssue || '제목 없음',
    plan: issue.plan || issue.followUpPlan || '계획 없음',
    score: issue.score || 0
  }));
}

/**
 * 전략 제언 파싱 (라벨 기반 → 구조화)
 */
function parseStrategyRecommendation(text) {
  const result = {
    전략명: '-',
    대상: '-',
    요약: '-',
    조치: '-',
    '예상 효과': '-'
  };
  
  try {
    // 라벨 기반 파싱 시도
    const labelMatches = text.match(/\[([^\]]+)\]:\s*([^\[\n]+)/g);
    if (labelMatches) {
      labelMatches.forEach(match => {
        const [, label, content] = match.match(/\[([^\]]+)\]:\s*([^\[\n]+)/);
        const cleanLabel = label.trim();
        const cleanContent = content.trim();
        
        if (result.hasOwnProperty(cleanLabel)) {
          result[cleanLabel] = cleanContent;
        }
      });
    } else {
      // 라벨이 없으면 줄 순서대로 매핑
      const lines = text.split('\n').filter(line => line.trim()).slice(0, 5);
      const keys = Object.keys(result);
      lines.forEach((line, idx) => {
        if (keys[idx]) {
          result[keys[idx]] = line.trim();
        }
      });
    }
  } catch (error) {
    console.error('전략 제언 파싱 실패:', error);
  }
  
  return result;
}

/**
 * Fallback 요약 생성
 */
function generateFallbackSummary(customer, issues) {
  if (!issues || issues.length === 0) {
    return `고객사 ${customer}에 대한 분석할 이슈가 없습니다.`;
  }
  
  const issueCount = issues.length;
  const avgScore = issues.reduce((sum, issue) => sum + (issue.score || 0), 0) / issueCount;
  
  return `고객사 ${customer}의 이슈 ${issueCount}건 분석 (평균 점수: ${avgScore.toFixed(1)}) - AI 요약 실패로 기본 정보만 제공`;
}

/**
 * Fallback 전략 제언 생성
 */
function generateFallbackStrategy(customer, issues) {
  const text = `고객사 ${customer}에 대한 전략 제언 생성에 실패했습니다. 시스템 관리자에게 문의하시기 바랍니다.`;
  
  const parsed = {
    전략명: '시스템 점검 필요',
    대상: customer,
    요약: 'AI 분석 시스템 오류',
    조치: '시스템 관리자 문의',
    '예상 효과': '정상 서비스 복구'
  };
  
  return { text, parsed };
}

module.exports = { summary, strategy }; 