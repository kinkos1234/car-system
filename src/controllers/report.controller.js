const reportService = require('../services/report.service');
const schedulerService = require('../services/scheduler.service');
const { convertBigIntToString } = require('../utils/bigint');

// 보고서 생성 작업 상태 저장소 (실제 환경에서는 Redis 등 사용 권장)
const reportJobs = new Map();

exports.getLatest = async (req, res, next) => {
  try {
    const report = await reportService.getLatest(req.query);
    if (!report) return res.status(404).json({ error: '주간 보고서 없음' });
    const convertedReport = convertBigIntToString(report);
    res.json(convertedReport);
  } catch (e) {
    next(e);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const report = await reportService.generateReport();
    const convertedReport = convertBigIntToString(report);
    res.status(201).json(convertedReport);
  } catch (e) {
    next(e);
  }
};

// 주간 보고서 목록 조회
exports.getWeeklyReports = async (req, res, next) => {
  try {
    const reports = await reportService.getWeeklyReports();
    const convertedReports = convertBigIntToString(reports);
    res.json(convertedReports);
  } catch (e) {
    next(e);
  }
};

// 주간 보고서 단일 조회
exports.getWeeklyReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await reportService.getWeeklyReportById(parseInt(id));
    if (!report) {
      return res.status(404).json({ error: '보고서를 찾을 수 없습니다.' });
    }
    const convertedReport = convertBigIntToString(report);
    res.json(convertedReport);
  } catch (e) {
    next(e);
  }
};

// 스케줄러 상태 조회
exports.getSchedulerStatus = async (req, res, next) => {
  try {
    const status = schedulerService.getSchedulerStatus();
    res.json(status);
  } catch (e) {
    next(e);
  }
};

// 스케줄러 시작
exports.startScheduler = async (req, res, next) => {
  try {
    schedulerService.startScheduler();
    const status = schedulerService.getSchedulerStatus();
    res.json({ 
      success: true, 
      message: '스케줄러가 시작되었습니다.',
      status 
    });
  } catch (e) {
    next(e);
  }
};

// 스케줄러 중지
exports.stopScheduler = async (req, res, next) => {
  try {
    schedulerService.stopScheduler();
    const status = schedulerService.getSchedulerStatus();
    res.json({ 
      success: true, 
      message: '스케줄러가 중지되었습니다.',
      status 
    });
  } catch (e) {
    next(e);
  }
};

// 수동 보고서 생성
exports.runManualReport = async (req, res, next) => {
  try {
    const report = await schedulerService.runManualReportGeneration();
    const convertedReport = convertBigIntToString(report);
    res.json({
      success: true,
      message: '수동 보고서 생성이 완료되었습니다.',
      report: convertedReport
    });
  } catch (e) {
    next(e);
  }
};

exports.generateReportAsync = async (req, res) => {
  try {
    const jobId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 작업 초기 상태 저장
    reportJobs.set(jobId, {
      id: jobId,
      status: 'started',
      startTime: new Date(),
      progress: {
        totalCompanies: 0,
        completedCompanies: 0,
        currentCompany: null,
        currentStep: 'initializing'
      },
      result: null,
      error: null
    });

    // 즉시 작업 ID 반환
    res.json({
      success: true,
      message: '🚀 AI 보고서 생성 작업이 시작되었습니다.',
      jobId: jobId,
      estimatedDuration: '약 3-5분 예상'
    });

    // 백그라운드에서 비동기 실행
    processReportGeneration(jobId).catch(error => {
      console.error('⚠️ 백그라운드 보고서 생성 오류:', error);
      
      // 오류 상태 업데이트
      const job = reportJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message || '알 수 없는 오류가 발생했습니다.';
        job.endTime = new Date();
        reportJobs.set(jobId, job);
      }
    });

  } catch (error) {
    console.error('⚠️ 보고서 생성 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 생성 요청 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 백그라운드 보고서 생성 프로세스
const processReportGeneration = async (jobId) => {
  const job = reportJobs.get(jobId);
  if (!job) throw new Error(`작업 ID ${jobId}를 찾을 수 없습니다.`);

  try {
    job.status = 'in_progress';
    job.progress.currentStep = 'loading_data';
    reportJobs.set(jobId, job);

    console.log(`🔄 [${jobId}] AI 보고서 생성 백그라운드 처리 시작...`);
    
    // 실제 보고서 생성 로직 실행
    const result = await reportService.generateWeeklyReport((progress) => {
      // 진행 상황 업데이트 콜백
      if (progress) {
        const currentJob = reportJobs.get(jobId);
        if (currentJob) {
          currentJob.progress = { ...currentJob.progress, ...progress };
          reportJobs.set(jobId, currentJob);
        }
      }
    });

    // 성공 상태 업데이트
    job.status = 'completed';
    job.result = result;
    job.endTime = new Date();
    job.progress.currentStep = 'completed';
    reportJobs.set(jobId, job);

    console.log(`✅ [${jobId}] AI 보고서 생성 완료 - ID: ${result.id}`);

  } catch (error) {
    console.error(`❌ [${jobId}] AI 보고서 생성 실패:`, error);
    
    job.status = 'failed';
    job.error = error.message || '보고서 생성 중 오류가 발생했습니다.';
    job.endTime = new Date();
    job.progress.currentStep = 'failed';
    reportJobs.set(jobId, job);
    
    throw error;
  }
};

// 작업 상태 조회
exports.getReportJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = reportJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: '작업을 찾을 수 없습니다.',
        jobId: jobId
      });
    }

    // 완료된 작업은 일정 시간 후 삭제 (메모리 관리)
    if (job.status === 'completed' || job.status === 'failed') {
      const elapsed = Date.now() - new Date(job.endTime || job.startTime).getTime();
      if (elapsed > 10 * 60 * 1000) { // 10분 후 삭제
        reportJobs.delete(jobId);
        return res.status(410).json({
          success: false,
          message: '작업 결과가 만료되었습니다.',
          jobId: jobId
        });
      }
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        startTime: job.startTime,
        endTime: job.endTime,
        progress: job.progress,
        result: job.result,
        error: job.error,
        duration: job.endTime 
          ? Math.round((new Date(job.endTime) - new Date(job.startTime)) / 1000)
          : Math.round((Date.now() - new Date(job.startTime)) / 1000)
      }
    });

  } catch (error) {
    console.error('작업 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '작업 상태 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 현재 진행 중인 작업 목록 조회
exports.getActiveReportJobs = async (req, res) => {
  try {
    const activeJobs = Array.from(reportJobs.values())
      .filter(job => job.status === 'started' || job.status === 'in_progress')
      .map(job => ({
        id: job.id,
        status: job.status,
        startTime: job.startTime,
        progress: job.progress,
        duration: Math.round((Date.now() - new Date(job.startTime)) / 1000)
      }));

    res.json({
      success: true,
      activeJobs: activeJobs,
      totalActiveJobs: activeJobs.length
    });

  } catch (error) {
    console.error('활성 작업 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '활성 작업 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// module.exports는 이미 exports.함수명으로 정의된 함수들을 자동으로 포함합니다. 