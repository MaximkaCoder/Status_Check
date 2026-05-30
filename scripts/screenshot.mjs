import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'screenshots');
const BASE = 'https://status-check-henna.vercel.app';

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('✓', name);
}

async function main() {
  const browser = await chromium.launch();

  // ── Desktop light ──────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await shot(page, 'ss-dashboard-light.png');
    await ctx.close();
  }

  // ── Desktop dark ───────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    // force dark via localStorage
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await shot(page, 'ss-dashboard-dark.png');
    await ctx.close();
  }

  // ── Mobile light ───────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await shot(page, 'ss-mobile-light.png');
    await ctx.close();
  }

  // ── Mobile dark ────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await shot(page, 'ss-mobile-dark.png');
    await ctx.close();
  }

  // ── New item page ──────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/items/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await shot(page, 'ss-new-item.png');
    await ctx.close();
  }

  await browser.close();
  console.log('All screenshots saved to public/screenshots/');
}

main().catch(e => { console.error(e); process.exit(1); });
