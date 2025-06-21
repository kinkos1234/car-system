import { test, expect } from '@playwright/test';

test('로그인 성공/실패 시나리오', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'admin');
  await page.fill('input[type="password"]', 'samsong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/car/);

  // 실패 케이스
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'wrong');
  await page.fill('input[type="password"]', 'wrong');
  await page.click('button[type="submit"]');
  await expect(page.locator('.text-red-500')).toContainText('로그인 실패');
}); 