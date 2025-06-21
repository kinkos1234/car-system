require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SendGrid API 키 설정
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid 이메일 서비스가 활성화되었습니다.');
} else {
  console.warn('⚠️ SENDGRID_API_KEY가 설정되지 않았습니다. 이메일 발송이 비활성화됩니다.');
}

/**
 * 주간 보고서 이메일 발송
 * @param {Object} report - 생성된 주간 보고서 객체
 */
async function sendWeeklyReport(report) {
  try {
    console.log('\n📧 주간 보고서 이메일 발송을 시작합니다...');
    
    // SENDGRID_API_KEY가 없으면 실행하지 않음
    if (!process.env.SENDGRID_API_KEY) {
      console.log('❌ SENDGRID_API_KEY가 설정되지 않아 이메일 발송을 건너뜁니다.');
      return { success: false, message: 'SENDGRID_API_KEY 미설정' };
    }

    // 메일 발송자 정보 확인
    const senderEmail = process.env.MAIL_SENDER || 'no-reply@samsong.com';
    const senderName = process.env.MAIL_SENDER_NAME || '삼송 CAR 시스템';

    // 주간 보고서 이메일 수신 대상자 조회
    const emailRecipients = await prisma.user.findMany({
      where: {
        weeklyReportEmail: true,
        email: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      }
    });

    if (emailRecipients.length === 0) {
      console.log('📭 이메일 수신 대상자가 없습니다.');
      return { success: true, message: '수신 대상자 없음', recipientCount: 0 };
    }

    console.log(`📫 총 ${emailRecipients.length}명에게 이메일을 발송합니다.`);
    emailRecipients.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) [${user.role}]`);
    });

    // 이메일 HTML 템플릿 생성
    const emailHtml = generateWeeklyReportHtml(report);
    const emailSubject = `[삼송 CAR 시스템] ${report.title || '주간 보고서'} - ${formatDate(report.weekStart)}`;

    // 개별 이메일 발송
    const sendResults = [];
    for (const recipient of emailRecipients) {
      try {
        const msg = {
          to: recipient.email,
          from: {
            email: senderEmail,
            name: senderName
          },
          subject: emailSubject,
          html: emailHtml,
          text: generateWeeklyReportText(report), // 텍스트 버전도 제공
        };

        await sgMail.send(msg);
        console.log(`✅ ${recipient.name} (${recipient.email})에게 발송 완료`);
        sendResults.push({ email: recipient.email, status: 'success' });
        
        // 발송 간격 (SendGrid API 제한 고려)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ ${recipient.name} (${recipient.email}) 발송 실패:`, error.message);
        sendResults.push({ email: recipient.email, status: 'failed', error: error.message });
      }
    }

    const successCount = sendResults.filter(r => r.status === 'success').length;
    const failCount = sendResults.filter(r => r.status === 'failed').length;

    console.log(`\n📊 이메일 발송 완료 - 성공: ${successCount}건, 실패: ${failCount}건`);
    
    return {
      success: true,
      message: `이메일 발송 완료 (성공: ${successCount}, 실패: ${failCount})`,
      recipientCount: emailRecipients.length,
      successCount,
      failCount,
      results: sendResults
    };

  } catch (error) {
    console.error('❌ 주간 보고서 이메일 발송 실패:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

/**
 * 주간 보고서 HTML 이메일 템플릿 생성
 * @param {Object} report - 보고서 객체
 * @returns {string} HTML 이메일 내용
 */
function generateWeeklyReportHtml(report) {
  const weekStartDate = formatDate(report.weekStart);
  const companies = Object.keys(report.data);
  
  let companySummaries = '';
  companies.forEach(company => {
    const data = report.data[company];
    if (!data) return;

    const summary = data.summary || {};
    const topIssues = data.topIssues || [];
    const aiRecommendation = data.aiRecommendation || '';

    companySummaries += `
      <!-- 고객사 섹션: ${company} -->
      <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse; border: 1px solid #e0e0e0;">
        <tr>
          <td style="padding: 20px; background-color: #f9f9f9;">
            
            <!-- 고객사 제목 -->
            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td style="border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                  <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">🏢 ${company}</h3>
                </td>
              </tr>
            </table>
            
            <!-- 주요 지표 -->
            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td>
                  <h4 style="color: #34495e; margin: 0 0 10px 0;">📊 주요 지표</h4>
                  <p style="margin: 5px 0; color: #333;">• 총 이벤트 수: <strong>${summary.totalEvents || 0}건</strong></p>
                  <p style="margin: 5px 0; color: #333;">• 평균 만족도: <strong>${summary.avgSentiment ? summary.avgSentiment.toFixed(1) : 'N/A'}점</strong></p>
                  <p style="margin: 5px 0; color: #333;">• 종합 점수: <strong>${summary.scoreSum ? summary.scoreSum.toFixed(1) : 'N/A'}점</strong></p>
                </td>
              </tr>
            </table>

        ${topIssues.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #34495e; margin-bottom: 15px;">🔥 주요 이슈 (Top ${topIssues.length})</h4>
                      ${topIssues.map((issue, index) => {
              // 이슈 제목을 60자마다 줄바꿈
              const titleLines = issue.title.match(/.{1,60}(\s|$)/g) || [issue.title];
              const formattedTitle = titleLines.map(line => line.trim()).join('<br>');
              
              // 해결 방안을 80자마다 줄바꿈
              const planLines = issue.plan.match(/.{1,80}(\s|$)/g) || [issue.plan];
              const formattedPlan = planLines.map(line => line.trim()).join('<br>');
              
              return `
            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding-bottom: 10px;">
                        <p style="margin: 0; font-weight: bold; color: #495057; font-size: 14px; line-height: 1.4;">
                          ${index + 1}. ${formattedTitle}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 10px;">
                        <p style="margin: 0; font-size: 12px; color: #e74c3c; font-weight: bold;">
                          점수: ${issue.score}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
                          <strong style="color: #495057;">해결 방안:</strong><br>
                          ${formattedPlan}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `;
            }).join('')}
        </div>
        ` : ''}

            ${aiRecommendation ? `
            <!-- AI 전략 제언 -->
            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td>
                  <h4 style="color: #34495e; margin: 0 0 15px 0;">🤖 AI 전략 제언</h4>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 15px; background-color: #e8f6f3; border: 1px solid #27ae60; border-left: 4px solid #27ae60;">
                  <p style="margin: 0; color: #2c3e50; font-size: 14px; line-height: 1.6;">
                    ${aiRecommendation.replace(/\n/g, '<br>')}
                  </p>
                </td>
              </tr>
            </table>
            ` : ''}
            
          </td>
        </tr>
      </table>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>삼송 CAR 시스템 주간 보고서</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4;">
      <table style="width: 100%; max-width: 800px; margin: 0 auto; background-color: #f4f4f4; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px;">
            
            <!-- 메인 컨테이너 -->
            <table style="width: 100%; background-color: white; border-collapse: collapse; border: 1px solid #ddd;">
              
              <!-- 헤더 -->
              <tr>
                <td style="background-color: #667eea; color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏢 삼송 CAR 시스템</h1>
                  <p style="margin: 10px 0 0; font-size: 18px;">주간 분석 보고서</p>
                  <p style="margin: 5px 0 0; font-size: 16px;">${weekStartDate} 기준</p>
                </td>
              </tr>

              <!-- 본문 -->
              <tr>
                <td style="padding: 30px;">
                  
                  <!-- 보고서 개요 -->
                  <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 20px; background-color: #f8f9fa; border: 1px solid #007bff; border-left: 4px solid #007bff;">
                        <h2 style="color: #495057; margin: 0 0 10px; font-size: 20px;">📋 보고서 개요</h2>
                        <p style="margin: 0; color: #6c757d; line-height: 1.5;">
                          본 보고서는 AI 기반 분석을 통해 생성된 ${companies.length}개 고객사의 주간 CAR(Customer Account Review) 현황을 담고 있습니다.<br>
                          각 고객사별 주요 이슈와 AI 전략 제언을 확인하실 수 있습니다.
                        </p>
                      </td>
                    </tr>
                  </table>

                  ${companySummaries}

                  <!-- 푸터 안내 -->
                  <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 20px; background-color: #e9ecef; border: 1px solid #ddd; text-align: center;">
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          본 메일은 자동으로 발송되었습니다. 문의사항은 시스템 관리자에게 연락해주세요.<br>
                          <strong>삼송 CAR 시스템</strong> | 생성일시: ${new Date().toLocaleString('ko-KR')}
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * 주간 보고서 텍스트 버전 생성
 * @param {Object} report - 보고서 객체
 * @returns {string} 텍스트 이메일 내용
 */
function generateWeeklyReportText(report) {
  const weekStartDate = formatDate(report.weekStart);
  const companies = Object.keys(report.data);
  
  let textContent = `
==============================================
삼송 CAR 시스템 주간 분석 보고서
${weekStartDate} 기준
==============================================

총 ${companies.length}개 고객사 분석 결과를 안내드립니다.

`;

  companies.forEach((company, index) => {
    const data = report.data[company];
    if (!data) return;

    const summary = data.summary || {};
    const topIssues = data.topIssues || [];
    const aiRecommendation = data.aiRecommendation || '';

    textContent += `
${index + 1}. ${company}
----------------------------------------------
주요 지표:
- 총 이벤트 수: ${summary.totalEvents || 0}건
- 평균 만족도: ${summary.avgSentiment ? summary.avgSentiment.toFixed(1) : 'N/A'}점
- 종합 점수: ${summary.scoreSum ? summary.scoreSum.toFixed(1) : 'N/A'}점

`;

    if (topIssues.length > 0) {
      textContent += `주요 이슈:\n`;
      topIssues.forEach((issue, idx) => {
        textContent += `${idx + 1}) ${issue.title} (점수: ${issue.score})\n`;
        // 긴 텍스트를 80자마다 줄바꿈하여 가독성 향상
        const planLines = issue.plan.match(/.{1,80}(\s|$)/g) || [issue.plan];
        planLines.forEach(line => {
          textContent += `   -> ${line.trim()}\n`;
        });
        textContent += '\n';
      });
    }

    if (aiRecommendation) {
      textContent += `AI 전략 제언:\n${aiRecommendation}\n\n`;
    }
  });

  textContent += `
==============================================
본 메일은 자동으로 발송되었습니다.
생성일시: ${new Date().toLocaleString('ko-KR')}
삼송 CAR 시스템
==============================================
`;

  return textContent;
}

/**
 * 관리자 알림 이메일 발송 (시스템 오류 시)
 * @param {Error} error - 발생한 오류
 */
async function notifyAdminOfFailure(error) {
  try {
    console.log('\n📧 시스템 관리자에게 오류 알림을 발송합니다...');
    
    if (!process.env.SENDGRID_API_KEY) {
      console.log('❌ SENDGRID_API_KEY가 설정되지 않아 알림 발송을 건너뜁니다.');
      return;
    }

    // 관리자 계정 조회 (ADMIN 역할)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        email: {
          not: null
        }
      },
      select: {
        name: true,
        email: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('📭 관리자 이메일이 설정되지 않았습니다.');
      return;
    }

    const senderEmail = process.env.MAIL_SENDER || 'no-reply@samsong.com';
    const senderName = process.env.MAIL_SENDER_NAME || '삼송 CAR 시스템';

    for (const admin of adminUsers) {
      const msg = {
        to: admin.email,
        from: {
          email: senderEmail,
          name: senderName
        },
        subject: '[긴급] 삼송 CAR 시스템 - AI 보고서 생성 실패',
        html: `
          <h2 style="color: #dc3545;">⚠️ 시스템 오류 발생</h2>
          <p><strong>발생 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          <p><strong>오류 내용:</strong></p>
          <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;">${error.message}</pre>
          <p><strong>오류 스택:</strong></p>
          <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6; font-size: 12px;">${error.stack}</pre>
          <p style="color: #6c757d; margin-top: 20px;">즉시 시스템을 점검해주세요.</p>
        `,
        text: `
시스템 오류가 발생했습니다.

발생 시간: ${new Date().toLocaleString('ko-KR')}
오류 내용: ${error.message}

즉시 시스템을 점검해주세요.
        `
      };

      await sgMail.send(msg);
      console.log(`✅ ${admin.name} (${admin.email})에게 알림 발송 완료`);
    }

  } catch (emailError) {
    console.error('❌ 관리자 알림 발송 실패:', emailError);
  }
}

/**
 * 날짜 포맷팅 유틸리티
 * @param {Date|string} date - 포맷할 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(date) {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  } catch (error) {
    return '날짜 정보 없음';
  }
}

module.exports = {
  sendWeeklyReport,
  notifyAdminOfFailure
}; 