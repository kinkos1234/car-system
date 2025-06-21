const express = require('express');
const { authMiddleware: auth, requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const reportCtrl = require('../controllers/report.controller');
const router = express.Router();

const prisma = new PrismaClient();

// 컨트롤러 임시: 추후 분리
router.get('/weekly/latest', auth, reportCtrl.getLatest);
router.post('/weekly/generate', auth, reportCtrl.generateReport);

// 비동기 보고서 생성 API
router.post('/weekly/generate-async', auth, reportCtrl.generateReportAsync);
router.get('/jobs/:jobId/status', auth, reportCtrl.getReportJobStatus);
router.get('/jobs/active', auth, reportCtrl.getActiveReportJobs);

// 주간 보고서 목록 조회
router.get('/weekly-reports', auth, reportCtrl.getWeeklyReports);

// 주간 보고서 단일 조회
router.get('/weekly-reports/:id', auth, reportCtrl.getWeeklyReportById);

// 더 직관적인 별칭 추가
router.post('/generate', auth, reportCtrl.generateReport);
router.post('/generate-async', auth, reportCtrl.generateReportAsync);

// 스케줄러 관리 API
router.get('/scheduler/status', auth, reportCtrl.getSchedulerStatus);
router.post('/scheduler/start', auth, reportCtrl.startScheduler);
router.post('/scheduler/stop', auth, reportCtrl.stopScheduler);
router.post('/scheduler/manual-run', auth, reportCtrl.runManualReport);

// 이메일 발송 API 추가
router.post('/send-email', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const emailService = require('../services/email.service');
    
    // 최신 주간 보고서 조회
    const latestReport = await prisma.weeklyReport.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestReport) {
      return res.status(404).json({ 
        success: false, 
        message: '발송할 보고서가 없습니다. 먼저 주간 보고서를 생성해주세요.' 
      });
    }

    // 이메일 발송
    const result = await emailService.sendWeeklyReport(latestReport);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        reportId: latestReport.id,
        reportTitle: latestReport.title,
        recipientCount: result.recipientCount || 0,
        successCount: result.successCount || 0,
        failCount: result.failCount || 0
      }
    });
    
  } catch (error) {
    console.error('이메일 발송 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '이메일 발송 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

module.exports = router; 