const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS 설정: 다양한 호스트에서의 접근 허용
app.use(cors({
  origin: true, // 모든 origin 허용 (개발 환경)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// 라우터 연결 (추후 각 라우터로 분리)
app.use('/api/car', require('./routes/car.route'));
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/customer', require('./routes/customer.route'));
app.use('/api/report', require('./routes/report.route'));
app.use('/api/ai', require('./routes/ai.route'));

// 기본 헬스체크
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app; 