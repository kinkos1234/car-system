import { test, expect } from '@playwright/test';

const users = [
  { id: 'admin', pw: 'samsong', role: 'ADMIN' },
  { id: 'manager', pw: 'managerpw', role: 'MANAGER' },
  { id: 'staff', pw: 'staffpw', role: 'STAFF' },
];

test.describe('권한별 UI 노출/비노출', () => {
  for (const user of users) {
    test(`${user.role} 권한 UI`, async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[placeholder="ID"]', user.id);
      await page.fill('input[type="password"]', user.pw);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/car/);

      // 네비게이션 메뉴 렌더링 대기
      await page.waitForSelector('a[href="/car"]', { timeout: 10000 });
      await page.waitForSelector('a[href="/customer"]', { timeout: 10000 });

      await expect(page.locator('a[href="/car"]')).toBeVisible();
      await expect(page.locator('a[href="/customer"]')).toBeVisible();
      if (user.role !== 'STAFF') {
        await page.waitForSelector('a[href="/report"]', { timeout: 10000 });
        await expect(page.locator('a[href="/report"]')).toBeVisible();
      } else {
        await expect(page.locator('a[href="/report"]')).not.toBeVisible();
      }
      if (user.role === 'ADMIN') {
        await page.waitForSelector('a[href="/ai"]', { timeout: 10000 });
        await expect(page.locator('a[href="/ai"]')).toBeVisible();
      } else {
        await expect(page.locator('a[href="/ai"]')).not.toBeVisible();
      }

      // 로그아웃
      await page.click('button:has-text("로그아웃")');
      await expect(page).toHaveURL(/login/);
    });
  }
}); 