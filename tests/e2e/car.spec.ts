import { test, expect } from '@playwright/test';

test('CAR 리스트/상세/등록/삭제 플로우', async ({ page }) => {
  // 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'admin');
  await page.fill('input[type="password"]', 'samsong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/car/);

  // CAR 리스트 진입
  await expect(page.locator('h2')).toContainText('CAR 리스트');

  // 상세 버튼 렌더링 대기
  await page.waitForSelector('table tbody tr:first-child button:has-text("상세")', { timeout: 10000 });

  // CAR 상세 진입 (첫 row 클릭)
  await page.click('table tbody tr:first-child button:has-text("상세")');
  await expect(page.locator('h2')).toContainText('CAR 상세');

  // (권한별) 등록 버튼 노출 여부 확인
  // 등록 버튼 클릭 → 등록 폼 진입, 취소
  // 삭제 버튼 클릭 → 확인 후 삭제, 리스트 복귀
  // (실제 등록/삭제는 데이터베이스 상태에 따라 조정 필요)
}); 