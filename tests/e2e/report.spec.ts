import { test, expect } from '@playwright/test';

test('보고서 리스트/상세/AI Mock 버튼 플로우', async ({ page }) => {
  // 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'admin');
  await page.fill('input[type="password"]', 'samsong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/car/);

  // 보고서 메뉴 진입
  await page.waitForSelector('a[href="/report"]', { timeout: 10000 });
  await page.click('a[href="/report"]');
  await expect(page.locator('h2')).toContainText('주간 보고서');

  // 상세 버튼 렌더링 대기
  await page.waitForSelector('table tbody tr:first-child button:has-text("상세")', { timeout: 10000 });

  // 보고서 상세 진입 (첫 row 클릭)
  await page.click('table tbody tr:first-child button:has-text("상세")');
  await expect(page.locator('h2')).toContainText('주간보고서');
  await page.click('button:has-text("목록으로")');

  // AI 메뉴 진입
  await page.waitForSelector('a[href="/ai"]', { timeout: 10000 });
  await page.click('a[href="/ai"]');
  await expect(page.locator('h2')).toContainText('AI 분석 결과');

  // AI 분석 요청 버튼 클릭(Mock)
  await page.waitForSelector('button:has-text("AI 분석 요청")', { timeout: 10000 });
  await page.click('button:has-text("AI 분석 요청")');
  await expect(page.locator('button:has-text("AI 분석 중...")')).toBeVisible();

  // 메일로 결과 전송 버튼 클릭(Mock)
  await page.waitForSelector('button:has-text("메일로 결과 전송")', { timeout: 10000 });
  await page.click('button:has-text("메일로 결과 전송")');
  await expect(page.locator('button:has-text("메일 발송 중...")')).toBeVisible();
}); 