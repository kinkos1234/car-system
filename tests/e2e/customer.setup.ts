import { test, expect } from '@playwright/test';

test('로그인 및 storageState 저장', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'admin');
  await page.fill('input[placeholder="비밀번호"]', 'samsong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/car/);
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).not.toBeNull();
  await page.context().storageState({ path: 'tests/e2e/state.json' });
}); 