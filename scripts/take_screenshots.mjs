import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log('1. Capturing Login Page...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/screenshot-login-aktu.png' });

  console.log('2. Capturing Public Portal...');
  await page.goto('http://localhost:5173/#public');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/screenshot-public-portal.png', fullPage: true });

  console.log('3. Logging in as Principal to capture Authenticated Dashboard...');
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Principal' }).click();
  await page.getByRole('button', { name: 'Sign In Securely' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/screenshot-dashboard-aktu.png', fullPage: true });

  console.log('All screenshots captured successfully.');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
