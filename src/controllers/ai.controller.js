const aiService = require('../services/ai.service');
const { convertBigIntToString } = require('../utils/bigint');

exports.summary = async (req, res, next) => {
  try {
    const result = await aiService.summary(req.body);
    const convertedResult = convertBigIntToString(result);
    res.json(convertedResult);
  } catch (e) {
    next(e);
  }
};

exports.strategy = async (req, res, next) => {
  try {
    const result = await aiService.strategy(req.body);
    const convertedResult = convertBigIntToString(result);
    res.json(convertedResult);
  } catch (e) {
    next(e);
  }
}; 