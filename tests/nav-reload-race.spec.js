import { test, expect } from '@playwright/test';
import { openPrimary } from './helpers/app.js';

test('desktop transient reload waits for Money without requiring a nonexistent Menu', async ({ page }) => {
  await page.setContent('<main><h1 hidden>Bills, Recurring & Budgets</h1></main>');
  await page.evaluate(() => {
    window.GringottsV126 = { coordinator: { snapshot: () => ({ status:'ready', route:'money' }) } };
    setTimeout(() => {
      const button = document.createElement('button');
      button.textContent = 'Money';
      button.addEventListener('click', () => {
        document.querySelector('h1').hidden = false;
      });
      document.querySelector('main').prepend(button);
    }, 100);
  });
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name:/Bills, Recurring & Budgets/i })).toBeVisible();
  await expect(page.getByRole('button', { name:/Menu/i })).toHaveCount(0);
});

test('mobile closed navigation still opens visible Menu before primary destination', async ({ page }) => {
  await page.setContent('<main><button id="menu">Menu</button><button id="money" hidden>Money</button><h1 hidden>Bills, Recurring & Budgets</h1></main>');
  await page.evaluate(() => {
    window.GringottsV126 = { coordinator: { snapshot: () => ({ status:'ready', route:'money' }) } };
    const money = document.getElementById('money');
    document.getElementById('menu').addEventListener('click', () => {
      money.hidden = false;
    });
    money.addEventListener('click', () => {
      document.querySelector('h1').hidden = false;
    });
  });
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name:/Bills, Recurring & Budgets/i })).toBeVisible();
});
