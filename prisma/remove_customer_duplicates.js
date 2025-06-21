// CustomerContact 중복 제거 스크립트
// name, company, department가 모두 동일한 경우 중복으로 간주, 1건만 남기고 삭제

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
  // 1. 모든 CustomerContact 데이터 조회
  const all = await prisma.customerContact.findMany();

  // 2. 중복 그룹핑: key = name|company|department
  const map = new Map();
  for (const row of all) {
    const key = `${row.name}|${row.company}|${row.department}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }

  // 3. 중복(2건 이상)인 그룹의 id만 추출(최신 1건만 남김)
  const idsToDelete = [];
  for (const group of map.values()) {
    if (group.length > 1) {
      // createdAt 기준 내림차순 정렬(최신 1건 남김)
      group.sort((a, b) => b.createdAt - a.createdAt);
      const toDelete = group.slice(1).map(r => r.id);
      idsToDelete.push(...toDelete);
    }
  }

  // 4. 삭제 실행
  if (idsToDelete.length > 0) {
    await prisma.customerContact.deleteMany({ where: { id: { in: idsToDelete } } });
    console.log(`중복 데이터 ${idsToDelete.length}건 삭제 완료.`);
  } else {
    console.log('중복 데이터 없음.');
  }
}

removeDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 