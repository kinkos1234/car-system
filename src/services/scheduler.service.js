const cron = require('node-cron');
const reportService = require('./report.service');
const emailService = require('./email.service');

/**
 * 스케줄러 서비스
 * - 매주 월요일 08:30 (한국 시간) AI 보고서 자동 생성
 */

let isSchedulerRunning = false;

/**
 * 스케줄러 시작
 */
function startScheduler() {
  if (isSchedulerRunning) {
    console.log('📅 스케줄러가 이미 실행 중입니다.');
    return;
  }

  // 매주 월요일 08:30 (한국 시간) - cron: 초 분 시 일 월 요일
  // 0 30 8 * * 1 = 매주 월요일 08:30
  const cronExpression = '0 30 8 * * 1';
  
  console.log('📅 AI 보고서 자동 생성 스케줄러를 시작합니다.');
  console.log(`⏰ 스케줄: 매주 월요일 08:30 (한국 시간)`);
  console.log(`🔧 Cron 표현식: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    console.log('\n🚀 [자동 스케줄] AI 보고서 생성 작업을 시작합니다.');
    console.log(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
    
    try {
      const report = await reportService.generateReport();
      
      console.log('✅ [자동 스케줄] AI 보고서 생성 완료!');
      console.log(`📊 보고서 ID: ${report.id}`);
      console.log(`🏢 분석 고객사 수: ${Object.keys(report.data).length}개`);
      console.log(`⏱️ 완료 시간: ${new Date().toLocaleString('ko-KR')}\n`);
      
      // 주간 보고서 자동 이메일 발송
      const emailResult = await emailService.sendWeeklyReport(report);
      if (emailResult.success) {
        console.log(`📧 [자동 스케줄] 이메일 발송 완료: ${emailResult.message}`);
      } else {
        console.error(`❌ [자동 스케줄] 이메일 발송 실패: ${emailResult.message}`);
      }
      
    } catch (error) {
      console.error('❌ [자동 스케줄] AI 보고서 생성 실패:', error.message);
      console.error('📧 시스템 관리자에게 알림이 필요합니다.');
      
      // 관리자 알림 발송
      await emailService.notifyAdminOfFailure(error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"  // 한국 시간대 설정
  });
  
  isSchedulerRunning = true;
  console.log('✅ 스케줄러가 성공적으로 시작되었습니다.\n');
}

/**
 * 스케줄러 중지
 */
function stopScheduler() {
  if (!isSchedulerRunning) {
    console.log('📅 스케줄러가 실행되고 있지 않습니다.');
    return;
  }
  
  // cron.destroy()는 모든 작업을 중지시킴
  cron.getTasks().forEach(task => task.destroy());
  isSchedulerRunning = false;
  console.log('🛑 스케줄러가 중지되었습니다.');
}

/**
 * 수동 테스트용 - 즉시 보고서 생성
 */
async function runManualReportGeneration() {
  console.log('\n🧪 [수동 테스트] AI 보고서 생성을 시작합니다.');
  console.log(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
  
  try {
    const report = await reportService.generateReport();
    
    console.log('✅ [수동 테스트] AI 보고서 생성 완료!');
    console.log(`📊 보고서 ID: ${report.id}`);
    console.log(`🏢 분석 고객사 수: ${Object.keys(report.data).length}개`);
    console.log(`⏱️ 완료 시간: ${new Date().toLocaleString('ko-KR')}\n`);
    
    // 수동 테스트에서도 이메일 발송 (선택사항)
    // const emailResult = await emailService.sendWeeklyReport(report);
    // if (emailResult.success) {
    //   console.log(`📧 [수동 테스트] 이메일 발송 완료: ${emailResult.message}`);
    // }
    
    return report;
    
  } catch (error) {
    console.error('❌ [수동 테스트] AI 보고서 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 다음 실행 예정 시간 확인
 */
function getNextScheduledTime() {
  if (!isSchedulerRunning) {
    return null;
  }
  
  // 다음 월요일 08:30 계산
  const now = new Date();
  const nextMonday = new Date(now);
  
  // 현재 요일 (0=일요일, 1=월요일, ...)
  const currentDay = now.getDay();
  const daysUntilMonday = currentDay === 0 ? 1 : (8 - currentDay) % 7;
  
  if (daysUntilMonday === 0) {
    // 오늘이 월요일인 경우
    const todayAt830 = new Date(now);
    todayAt830.setHours(8, 30, 0, 0);
    
    if (now < todayAt830) {
      // 아직 08:30이 지나지 않은 경우
      nextMonday.setTime(todayAt830.getTime());
    } else {
      // 이미 08:30이 지난 경우, 다음 주 월요일
      nextMonday.setDate(now.getDate() + 7);
      nextMonday.setHours(8, 30, 0, 0);
    }
  } else {
    // 다른 요일인 경우
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 30, 0, 0);
  }
  
  return nextMonday;
}

/**
 * 스케줄러 상태 확인
 */
function getSchedulerStatus() {
  return {
    isRunning: isSchedulerRunning,
    nextRun: getNextScheduledTime(),
    cronExpression: '0 30 8 * * 1',
    timezone: 'Asia/Seoul',
    description: '매주 월요일 08:30 (한국 시간) AI 보고서 자동 생성'
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  runManualReportGeneration,
  getNextScheduledTime,
  getSchedulerStatus
}; 