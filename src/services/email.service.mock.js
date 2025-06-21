/**
 * 메일 서비스 목업 - 포트폴리오용 시뮬레이션
 * 실제 SendGrid API 호출 없이 메일 발송을 시뮬레이션
 */

// 발송 이력 저장소 (메모리 기반)
let emailHistory = [];

/**
 * 목업 메일 발송
 * @param {Object} params - { to, subject, content, attachments }
 * @returns {Object} - 발송 결과
 */
async function sendEmail({ to, subject, content, attachments = [] }) {
  console.log(`📧 [MOCK] 메일 발송 시뮬레이션 시작`);
  console.log(`📧 수신자: ${to}`);
  console.log(`📧 제목: ${subject}`);
  
  // 실제 메일 발송 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 발송 이력 기록
  const emailRecord = {
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    to,
    subject,
    content: content.substring(0, 100) + '...',
    attachments: attachments.map(att => ({ name: att.filename, size: att.content?.length || 0 })),
    sentAt: new Date().toISOString(),
    status: 'delivered',
    provider: 'mock',
    _isMock: true
  };
  
  emailHistory.push(emailRecord);
  
  console.log(`✅ [MOCK] 메일 발송 완료 - ID: ${emailRecord.id}`);
  
  return {
    success: true,
    messageId: emailRecord.id,
    to,
    subject,
    sentAt: emailRecord.sentAt,
    _isMock: true
  };
}

/**
 * 주간 보고서 메일 발송 (특별 처리)
 * @param {Object} params - { recipients, reportData, weekStart }
 * @returns {Object} - 발송 결과
 */
async function sendWeeklyReport({ recipients, reportData, weekStart }) {
  console.log(`📊 [MOCK] 주간 보고서 메일 발송 시뮬레이션`);
  
  const subject = `[Comad J CAR] 주간 보고서 - ${new Date(weekStart).toLocaleDateString('ko-KR')}`;
  
  // 각 수신자별로 개별 발송 시뮬레이션
  const results = [];
  
  for (const recipient of recipients) {
    const content = generateWeeklyReportContent(reportData, recipient);
    
    const result = await sendEmail({
      to: recipient,
      subject,
      content,
      attachments: [
        {
          filename: `weekly_report_${new Date(weekStart).toISOString().split('T')[0]}.pdf`,
          content: Buffer.from('Mock PDF content'),
          type: 'application/pdf'
        }
      ]
    });
    
    results.push(result);
  }
  
  console.log(`✅ [MOCK] 주간 보고서 ${recipients.length}건 발송 완료`);
  
  return {
    success: true,
    totalSent: recipients.length,
    results,
    _isMock: true
  };
}

/**
 * 주간 보고서 HTML 컨텐츠 생성
 */
function generateWeeklyReportContent(reportData, recipient) {
  const companies = Object.keys(reportData.data || {});
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Comad J CAR 주간 보고서</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .company-section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .issue-item { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
        .strategy { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .mock-notice { background: #fef3c7; padding: 10px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Comad J CAR 시스템 주간 보고서</h1>
        <p>발송일: ${new Date().toLocaleDateString('ko-KR')}</p>
        <p>수신자: ${recipient}</p>
    </div>
    
    <div class="mock-notice">
        <strong>📋 포트폴리오 데모:</strong> 이 메일은 실제 발송되지 않았으며, 시스템 기능 시연을 위한 시뮬레이션입니다.
    </div>
    
    <h2>📊 고객사별 분석 요약</h2>
    
    ${companies.map(company => {
      const companyData = reportData.data[company];
      return `
        <div class="company-section">
            <h3>🏢 ${company}</h3>
            
            <h4>주요 이슈 (Top 5)</h4>
            ${companyData.topIssues?.map(issue => `
                <div class="issue-item">
                    <strong>${issue.title}</strong> (점수: ${issue.score})
                    <br>조치계획: ${issue.plan}
                </div>
            `).join('') || '<p>이슈 데이터 없음</p>'}
            
            <div class="strategy">
                <h4>🎯 AI 전략 제언</h4>
                <p>${companyData.aiRecommendation?.substring(0, 200) || '전략 제언 데이터 없음'}...</p>
            </div>
        </div>
      `;
    }).join('')}
    
    <hr>
    <p style="color: #6b7280; font-size: 12px;">
        본 보고서는 Comad J CAR 시스템에서 자동 생성되었습니다.<br>
        문의사항: admin@comadj.com
    </p>
</body>
</html>
  `;
}

/**
 * 발송 이력 조회
 */
function getEmailHistory(limit = 10) {
  return emailHistory
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, limit);
}

/**
 * 발송 이력 초기화 (테스트용)
 */
function clearEmailHistory() {
  emailHistory = [];
  console.log('📧 메일 발송 이력 초기화 완료');
}

/**
 * 메일 서비스 상태 확인
 */
function getServiceStatus() {
  return {
    provider: 'mock',
    status: 'active',
    totalSent: emailHistory.length,
    lastSent: emailHistory.length > 0 ? emailHistory[emailHistory.length - 1].sentAt : null,
    _isMock: true
  };
}

module.exports = {
  sendEmail,
  sendWeeklyReport,
  getEmailHistory,
  clearEmailHistory,
  getServiceStatus,
  generateWeeklyReportContent
}; 