require('dotenv').config();
const app = require('./app');
const schedulerService = require('./services/scheduler.service');

const PORT = process.env.PORT || 4000;
 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CAR 시스템 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌐 네트워크 접근: http://0.0.0.0:${PORT}`);
  
  // AI 보고서 자동 생성 스케줄러 시작
  console.log('\n📅 AI 보고서 자동 스케줄러를 초기화합니다...');
  schedulerService.startScheduler();
  
  const status = schedulerService.getSchedulerStatus();
  if (status.nextRun) {
    console.log(`⏰ 다음 자동 생성 예정: ${status.nextRun.toLocaleString('ko-KR')}`);
  }
  console.log('🎯 서버 초기화 완료!\n');
}); 