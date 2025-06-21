const bcrypt = require('bcryptjs');

// 비밀번호 해싱 함수
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 사용자별 비밀번호 해싱
async function generateHashedPasswords() {
  const users = [
    { email: 'admin@comadj.com', password: 'admin123' },
    { email: 'manager@comadj.com', password: 'manager123' },
    { email: 'staff@comadj.com', password: 'staff123' }
  ];

  console.log('=== 해싱된 비밀번호 ===');
  
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);
    console.log(`\n${user.email}:`);
    console.log(`원본: ${user.password}`);
    console.log(`해싱: ${hashedPassword}`);
    
    // Supabase SQL 업데이트 쿼리 생성
    console.log(`\nSQL 쿼리:`);
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = '${user.email}';`);
  }
}

generateHashedPasswords().catch(console.error); 