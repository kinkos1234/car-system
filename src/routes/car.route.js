const express = require('express');
const { authMiddleware: auth } = require('../middlewares/auth.middleware');
const carCtrl = require('../controllers/car.controller');
const { canDeleteCar } = require('../middlewares/role.middleware');
const router = express.Router();
const carService = require('../services/car.service');

// 필터 옵션 전체 조회 (드롭다운용) - 반드시 /:id보다 위에 선언
router.get('/filters', auth, carCtrl.getFilterOptions);

// 전체 상태 통계 API 추가 (인증 없이)
router.get('/status-stats', carCtrl.getStatusStats);

// 누적 Score 조회 (BarChart용) - 실제 백엔드 서비스 연결
router.get('/accumulated-scores', async (req, res) => {
  try {
    const { 
      groupType = 'company',
      targetYear,
      targetMonth,
      corp,
      customerGroup,
      dept,
      status
    } = req.query;

    // 기본값 설정 (현재 년/월)
    const now = new Date();
    const year = parseInt(targetYear) || now.getFullYear();
    const month = parseInt(targetMonth) || (now.getMonth() + 1);

    // 필터 구성
    const filters = {};
    if (corp && corp !== '전체') filters.corp = corp;
    if (customerGroup) {
      const groups = Array.isArray(customerGroup) ? customerGroup : [customerGroup];
      filters.customerGroup = groups;
    }
    if (dept && dept !== '전체') filters.dept = dept;
    if (status && status !== '전체') filters.status = status;

    // 백엔드 서비스 호출
    const carService = require('../services/car.service');
    const accumulatedData = await carService.getAccumulatedScoresByGroup(groupType, year, month, filters);

    res.json({ 
      success: true, 
      data: accumulatedData
    });
  } catch (error) {
    console.error('누적 Score 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '누적 Score 조회에 실패했습니다.',
      error: error.message 
    });
  }
});

// 월별 추이 조회 (LineChart용) - 실제 백엔드 서비스 연결
router.get('/monthly-trend', async (req, res) => {
  try {
    const { 
      groupType = 'company', 
      startYear, 
      startMonth, 
      endYear, 
      endMonth,
      corp,
      customerGroup,
      dept,
      status
    } = req.query;

    // 기본값 설정 (최근 6개월)
    const now = new Date();
    const defaultEndYear = now.getFullYear();
    const defaultEndMonth = now.getMonth() + 1;
    const startDate = new Date(defaultEndYear, defaultEndMonth - 7, 1);
    const defaultStartYear = startDate.getFullYear();
    const defaultStartMonth = startDate.getMonth() + 1;

         // 월 범위 생성
     const months = [];
     const start = new Date(
       parseInt(startYear) || defaultStartYear, 
       (parseInt(startMonth) || defaultStartMonth) - 1, 
       1
     );
     const end = new Date(
       parseInt(endYear) || defaultEndYear, 
       (parseInt(endMonth) || defaultEndMonth) - 1, 
       1
     );

    let current = new Date(start);
    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: `${current.getMonth() + 1}월`
      });
      current.setMonth(current.getMonth() + 1);
    }

    // 필터 구성
    const filters = {};
    if (corp && corp !== '전체') filters.corp = corp;
    if (customerGroup) {
      const groups = Array.isArray(customerGroup) ? customerGroup : [customerGroup];
      filters.customerGroup = groups;
    }
    if (dept && dept !== '전체') filters.dept = dept;
    if (status && status !== '전체') filters.status = status;

    // 백엔드 서비스 호출
    const carService = require('../services/car.service');
    const monthlyData = await carService.getMonthlyTrend(groupType, months, filters);

    res.json({ 
      success: true, 
      data: monthlyData
    });
  } catch (error) {
    console.error('월별 추이 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '월별 추이 조회에 실패했습니다.',
      error: error.message 
    });
  }
});

// 컨트롤러 임시: 추후 분리 (임시로 인증 제거)
router.get('/', carCtrl.getList);
router.get('/:id', auth, carCtrl.getById);
router.post('/', auth, carCtrl.create);
router.put('/:id', auth, carCtrl.update);
router.delete('/:id', auth, canDeleteCar, carCtrl.remove);

// 디버깅용: CAR 데이터와 상태 확인
router.get('/debug/status', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // CONTINUOUS 타입의 CAR 데이터 조회
    const cars = await prisma.cAR.findMany({
      where: { eventType: 'CONTINUOUS' },
      take: 20,
      include: {
        carCustomerContacts: {
          include: { CustomerContact: true }
        }
      }
    });
    
    // 상태 계산 함수 (car.service.js와 동일)
    function calcStatus(car) {
      try {
        if (car.eventType === "ONE_TIME") {
          return "CLOSED";
        } 
        
        if (car.eventType === "CONTINUOUS") {
          if (car.completionDate && car.completionDate !== null && car.completionDate !== '') {
            return "CLOSED";
          }
          
          if (car.dueDate) {
            let dueDateValue;
            if (typeof car.dueDate === 'bigint') {
              dueDateValue = Number(car.dueDate);
            } else if (typeof car.dueDate === 'string') {
              dueDateValue = parseInt(car.dueDate);
            } else {
              dueDateValue = car.dueDate;
            }
            
            const dueDate = new Date(dueDateValue);
            const today = new Date();
            
            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            if (dueDateOnly < todayOnly) {
              return "DELAYED";
            }
          }
          
          return "IN_PROGRESS";
        }
        
        return "IN_PROGRESS";
      } catch (err) {
        console.error('상태 계산 오류:', err);
        return "IN_PROGRESS";
      }
    }
    
    // 각 CAR에 대해 상태 계산 및 디버깅 정보 수집
    const debugData = cars.map(car => {
      const today = new Date();
      const status = calcStatus(car);
      
      let dueDateFormatted = null;
      let dueDateValue = null;
      
      if (car.dueDate) {
        if (typeof car.dueDate === 'bigint') {
          dueDateValue = Number(car.dueDate);
        } else if (typeof car.dueDate === 'string') {
          dueDateValue = parseInt(car.dueDate);
        } else {
          dueDateValue = car.dueDate;
        }
        
        dueDateFormatted = new Date(dueDateValue).toISOString().slice(0, 10);
      }
      
      return {
        id: car.id,
        eventType: car.eventType,
        dueDate: typeof car.dueDate === 'bigint' ? car.dueDate.toString() : car.dueDate,
        dueDateType: typeof car.dueDate,
        dueDateFormatted: dueDateFormatted,
        completionDate: typeof car.completionDate === 'bigint' ? car.completionDate.toString() : car.completionDate,
        completionDateType: typeof car.completionDate,
        calculatedStatus: status,
        today: today.toISOString().slice(0, 10),
        isDelayed: status === 'DELAYED'
      };
    });
    
    const statusCounts = {
      IN_PROGRESS: debugData.filter(d => d.calculatedStatus === 'IN_PROGRESS').length,
      DELAYED: debugData.filter(d => d.calculatedStatus === 'DELAYED').length,
      CLOSED: debugData.filter(d => d.calculatedStatus === 'CLOSED').length
    };
    
    // BigInt 직렬화 문제 해결을 위한 커스텀 직렬화
    const responseData = {
      success: true,
      totalContinuous: cars.length,
      statusCounts,
      delayedItems: debugData.filter(d => d.isDelayed),
      sampleData: debugData.slice(0, 10)
    };
    
    // BigInt 값을 문자열로 변환
    const jsonString = JSON.stringify(responseData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonString);
    
  } catch (error) {
    console.error('디버그 API 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 테스트용: DELAYED 상태 CAR 생성
router.post('/debug/create-delayed', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 일부 CONTINUOUS CAR의 completionDate를 null로 설정하고 dueDate를 과거로 설정
    const today = new Date();
    const pastDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
    const pastTimestamp = pastDate.getTime();
    
    // 처음 3개의 CONTINUOUS CAR을 DELAYED 상태로 변경
    const carsToUpdate = await prisma.cAR.findMany({
      where: { eventType: 'CONTINUOUS' },
      take: 3
    });
    
    if (carsToUpdate.length === 0) {
      return res.json({ 
        success: false, 
        message: 'CONTINUOUS CAR가 없습니다.' 
      });
    }
    
    // 업데이트 실행
    const updatePromises = carsToUpdate.map(car => 
      prisma.cAR.update({
        where: { id: car.id },
        data: {
          completionDate: null, // 완료일 제거
          dueDate: pastTimestamp // 과거 기한일로 설정
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `${carsToUpdate.length}개의 CAR을 DELAYED 상태로 변경했습니다.`,
      updatedIds: carsToUpdate.map(car => car.id),
      newDueDate: pastDate.toISOString().slice(0, 10)
    });
    
  } catch (error) {
    console.error('DELAYED 데이터 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전체 상태 통계 API 추가
router.get('/status-stats', carCtrl.getStatusStats);

module.exports = router; 