const carService = require('../services/car.service');
const { convertBigIntToString } = require('../utils/bigint');

exports.getList = async (req, res, next) => {
  try {
    const result = await carService.getList(req.query);
    const convertedResult = convertBigIntToString(result);
    res.json(convertedResult);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const car = await carService.getById(req.params.id);
    if (!car) return res.status(404).json({ error: 'CAR not found' });
    const convertedCar = convertBigIntToString(car);
    res.json(convertedCar);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    // createdBy는 req.user.id로 강제 지정
    const data = { ...req.body, createdBy: req.user.id };
    const car = await carService.create(data);
    const convertedCar = convertBigIntToString(car);
    res.status(201).json(convertedCar);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const car = await carService.update(req.params.id, req.body);
    const convertedCar = convertBigIntToString(car);
    res.json(convertedCar);
  } catch (e) {
    console.error('CAR 업데이트 오류:', e.message);
    res.status(500).json({ 
      error: 'CAR 업데이트 실패', 
      message: e.message
    });
  }
};

exports.remove = async (req, res, next) => {
  try {
    await carService.remove(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    const options = await carService.getFilterOptions();
    const convertedOptions = convertBigIntToString(options);
    res.json(convertedOptions);
  } catch (e) {
    next(e);
  }
};

// 전체 상태 통계 조회
exports.getStatusStats = async (req, res) => {
  try {
    const stats = await carService.getStatusStats();
    res.json(stats);
  } catch (error) {
    console.error('전체 상태 통계 조회 실패:', error);
    res.status(500).json({ error: '전체 상태 통계 조회에 실패했습니다.' });
  }
}; 