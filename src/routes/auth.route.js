require('dotenv').config();
const express = require('express');
const jwtUtil = require('../utils/jwt');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // email은 loginId로 사용
  const user = await prisma.user.findUnique({ where: { loginId: email } });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwtUtil.sign({ id: user.id, name: user.name, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// 사용자 목록 조회 (ADMIN만 접근 가능)
router.get('/users', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        department: true,
        email: true,
        weeklyReportEmail: true,
        createdAt: true,
        updatedAt: true
        // password는 제외
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ error: '사용자 목록 조회에 실패했습니다.' });
  }
});

// 특정 사용자 조회 (ADMIN만 접근 가능)
router.get('/users/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        department: true,
        email: true,
        weeklyReportEmail: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회에 실패했습니다.' });
  }
});

// 사용자 생성 (ADMIN만 접근 가능)
router.post('/users', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { loginId, password, name, role, department, email, weeklyReportEmail } = req.body;
    
    // 필수 필드 검증
    if (!loginId || !password || !name || !role) {
      return res.status(400).json({ error: '로그인 ID, 비밀번호, 이름, 역할은 필수입니다.' });
    }
    
    // 역할 검증
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: '유효하지 않은 역할입니다.' });
    }
    
    // 중복 loginId 검사
    const existingUser = await prisma.user.findUnique({
      where: { loginId }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 로그인 ID입니다.' });
    }
    
    const user = await prisma.user.create({
      data: { 
        loginId, 
        password, 
        name, 
        role, 
        department: department || '',
        email: email || null,
        weeklyReportEmail: weeklyReportEmail || false
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        department: true,
        email: true,
        weeklyReportEmail: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({ error: '사용자 생성에 실패했습니다.' });
  }
});

// 사용자 수정 (ADMIN만 접근 가능)
router.put('/users/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { loginId, password, name, role, department, email, weeklyReportEmail } = req.body;
    
    // 필수 필드 검증
    if (!loginId || !name || !role) {
      return res.status(400).json({ error: '로그인 ID, 이름, 역할은 필수입니다.' });
    }
    
    // 역할 검증
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: '유효하지 않은 역할입니다.' });
    }
    
    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 다른 사용자가 같은 loginId를 사용하는지 확인
    const duplicateUser = await prisma.user.findFirst({
      where: {
        loginId,
        id: { not: parseInt(id) }
      }
    });
    
    if (duplicateUser) {
      return res.status(400).json({ error: '이미 존재하는 로그인 ID입니다.' });
    }
    
    // 업데이트 데이터 준비
    const updateData = { 
      loginId, 
      name, 
      role, 
      department: department || '',
      email: email || null,
      weeklyReportEmail: weeklyReportEmail !== undefined ? weeklyReportEmail : false
    };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        department: true,
        email: true,
        weeklyReportEmail: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    res.status(500).json({ error: '사용자 수정에 실패했습니다.' });
  }
});

// 사용자 삭제 (ADMIN만 접근 가능)
router.delete('/users/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 본인 계정 삭제 방지
    if (userId === req.user.id) {
      return res.status(400).json({ error: '본인 계정은 삭제할 수 없습니다.' });
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ error: '사용자 삭제에 실패했습니다.' });
  }
});

module.exports = router; 