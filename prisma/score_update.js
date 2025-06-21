// CAR 테이블 전체 score 일괄 계산/업데이트 스크립트
// 실행: node prisma/score_update.js
//
// 공식(문서 기준):
// - one_time: score = subjectiveScore
// - continuous: 완료(completionDate 존재) → score = (dateScore + internalScore + customerScore) * importance
//                미완료(completionDate 없음) → score = 0
// - dateScore: 기한 내 5, 1일 지연 3, 3일 지연 2, 1주 지연 0, 1달 지연 -3, 1달 초과 -5

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// [실무 확장형] sentimentScore 산출을 위한 긍정/부정 단어 리스트(30개 이상, VOC/CRM/품질/고객만족 등)
const POSITIVE_WORDS = [
  '좋다', '만족', '해결', '완료', '성공', '긍정', '향상', '개선', '신속', '안정',
  '친절', '감사', '추천', '신뢰', '정상', '빠르다', '정확', '유익', '도움', '협조',
  '적극', '안전', '청결', '편리', '효율', '믿음', '기쁨', '감동', '쾌적', '원활',
  '정리', '수월', '적합', '적시', '유연', '성실', '정직', '책임', '존중', '배려'
];
const NEGATIVE_WORDS = [
  '불만', '지연', '실패', '문제', '부정', '악화', '지속', '미해결', '오류', '불편',
  '불친절', '불신', '불량', '지체', '누락', '파손', '불가', '불안', '불확실', '불성실',
  '불합리', '불공정', '불쾌', '불만족', '불이행', '불통', '불평', '불충분', '불완전',
  '불일치', '불허', '불법', '불합격', '불응', '불가피', '불가항력', '불가결', '불가분',
  '불가사리', '불가사의', '불가촉', '불가피성'
];

function calcDateScore(dueDate, completionDate) {
  if (!dueDate || !completionDate) return 0;
  // BigInt를 Number로 변환 (timestamp)
  const dueDateNum = typeof dueDate === 'bigint' ? Number(dueDate) : dueDate;
  const completionDateNum = typeof completionDate === 'bigint' ? Number(completionDate) : completionDate;
  const due = new Date(dueDateNum);
  const comp = new Date(completionDateNum);
  const diff = Math.floor((comp - due) / (1000 * 60 * 60 * 24)); // 일수 차이
  if (diff <= 0) return 5; // 기한 내
  if (diff === 1) return 3;
  if (diff <= 3) return 2;
  if (diff <= 7) return 0;
  if (diff <= 30) return -3;
  return -5; // 1달 초과
}

function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') return null;
  let pos = 0, neg = 0;
  for (const w of POSITIVE_WORDS) if (text.includes(w)) pos++;
  for (const w of NEGATIVE_WORDS) if (text.includes(w)) neg++;
  // 공식: 50 + (긍정-부정)*25, 0~100 클리핑
  let score = 50 + (pos - neg) * 25;
  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return score;
}

function normalizeScore(score, min = -20, max = 20) {
  // score 필드 정규화(0~100), min/max는 데이터 분포에 따라 조정
  if (score == null) return 0;
  if (score < min) score = min;
  if (score > max) score = max;
  return ((score - min) / (max - min)) * 100;
}

function normalizeDateScore(dateScore) {
  // dateScore: -5~5 → 0~100
  if (dateScore == null) return 0;
  if (dateScore < -5) dateScore = -5;
  if (dateScore > 5) dateScore = 5;
  return ((dateScore + 5) / 10) * 100;
}

async function main() {
  const cars = await prisma.cAR.findMany();
  let updated = 0;
  for (const car of cars) {
    // --- score 계산(기존 로직) ---
    let score = null;
    if (car.eventType === 'ONE_TIME') {
      score = car.subjectiveScore != null ? car.subjectiveScore : 0;
    } else if (car.eventType === 'CONTINUOUS') {
      if (!car.completionDate) {
        score = 0;
      } else {
        const dateScore = calcDateScore(car.dueDate, car.completionDate);
        const internalScore = car.internalScore != null ? car.internalScore : 0;
        const customerScore = car.customerScore != null ? car.customerScore : 0;
        const importance = car.importance != null ? car.importance : 1;
        score = (dateScore + internalScore + customerScore) * importance;
      }
    } else {
      score = 0;
    }

    // --- sentimentScore 계산(확장 로직) ---
    // 1. 감정분석점수(0~100)
    const text = [car.openIssue, car.followUpPlan].filter(Boolean).join(' ');
    const sentiment = analyzeSentiment(text);
    // 2. score 정규화(0~100, min/max는 데이터 분포에 따라 조정)
    const normScore = normalizeScore(score);
    // 3. importance(0~1→0~100)
    const normImportance = car.importance != null ? car.importance * 100 : 0;
    // 4. dateScore 정규화
    let dateScore = 0;
    if (car.eventType === 'CONTINUOUS' && car.completionDate) {
      dateScore = calcDateScore(car.dueDate, car.completionDate);
    }
    const normDateScore = normalizeDateScore(dateScore);
    // 5. 가중합(0.4,0.3,0.2,0.1)
    let sentimentScore = null;
    if (sentiment != null) {
      sentimentScore = 0.4 * sentiment + 0.3 * normScore + 0.2 * normImportance + 0.1 * normDateScore;
      if (sentimentScore > 100) sentimentScore = 100;
      if (sentimentScore < 0) sentimentScore = 0;
    }

    // DB 업데이트
    await prisma.cAR.update({
      where: { id: car.id },
      data: { score, sentimentScore },
    });
    updated++;
  }
  console.log(`score/sentimentScore 일괄 계산/업데이트 완료: ${updated}건`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); }); 