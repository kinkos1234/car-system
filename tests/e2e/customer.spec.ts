import { test, expect } from '@playwright/test';

// 1. 로그인 및 storageState 저장
// 이 블록은 최초 1회만 실행되어 state.json을 생성
// 이후 테스트에서는 storageState를 재사용

test.describe.configure({ mode: 'serial' });

test('로그인 및 storageState 저장', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="ID"]', 'admin');
  await page.fill('input[placeholder="비밀번호"]', 'samsong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/car/);
  // localStorage에 토큰이 저장되어야 함
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).not.toBeNull();
  await page.context().storageState({ path: 'tests/e2e/state.json' });
});

test.use({ storageState: 'tests/e2e/state.json' });

test.describe('고객 관리 E2E', () => {
  test('고객 등록/리스트/상세/삭제', async ({ page }) => {
    // 2. 고객 등록
    await page.goto('http://localhost:3000/customer');
    await page.waitForSelector('text=등록', { timeout: 10000 });
    await page.click('text=등록');
    await page.fill('input[name="name"]', '테스트고객');
    await page.fill('input[name="company"]', '삼송');
    await page.fill('input[name="department"]', '영업');
    await page.fill('input[name="phone"]', '010-1234-5678');
    await page.fill('input[name="title"]', '과장');
    await page.fill('textarea[name="memo"]', '자동화 테스트');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/customer/);

    // 3. 리스트에서 등록된 고객 확인
    await expect(page.locator('td', { hasText: '테스트고객' })).toBeVisible();

    // 4. 상세 진입 및 삭제
    await page.click('text=상세');
    await expect(page.locator('div', { hasText: '테스트고객' })).toBeVisible();
    await page.click('text=삭제');
    await page.on('dialog', dialog => dialog.accept());
    await expect(page).toHaveURL(/customer/);
    await expect(page.locator('td', { hasText: '테스트고객' })).not.toBeVisible();
  });

  test('고객 리스트/상세/등록/삭제 플로우', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="ID"]', 'admin');
    await page.fill('input[type="password"]', 'samsong');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/car/);

    // 고객 메뉴 진입
    await page.click('a[href="/customer"]');
    await expect(page.locator('h2')).toContainText('고객 리스트');

    // 고객 상세 진입 (첫 row 클릭)
    await page.click('table tbody tr:first-child button:has-text("상세")');
    await expect(page.locator('h2')).toContainText('고객 상세');

    // (권한별) 등록 버튼 노출 여부 확인
    // 등록 버튼 클릭 → 등록 폼 진입, 취소
    // 삭제 버튼 클릭 → 확인 후 삭제, 리스트 복귀
    // (실제 등록/삭제는 데이터베이스 상태에 따라 조정 필요)
  });
}); 