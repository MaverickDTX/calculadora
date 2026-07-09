import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://calculadora-gray-one.vercel.app/';
const OUTPUT_DIR = path.join('C:', 'Projetos', 'calculadora', 'screenshots');

async function waitForHydration(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function loadExampleDesktop(page: Page, exampleKey: string) {
  const exampleButtons = page.locator('.btn-ghost, button[class*="btn-ghost"]');
  const count = await exampleButtons.count();
  
  for (let i = 0; i < count; i++) {
    const btn = exampleButtons.nth(i);
    const text = await btn.textContent();
    if (text) {
      if ((exampleKey === 'nres-1x2' && text.includes('1X2')) ||
          (exampleKey === 'poi-builder' && text.includes('Over'))) {
        await btn.click();
        await page.waitForTimeout(800);
        return true;
      }
    }
  }
  return false;
}

async function clickTabDesktop(page: Page, label: string) {
  const sidebar = page.locator('aside');
  await sidebar.locator(`button:has-text("${label}")`).first().click();
  await page.waitForTimeout(300);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  try {
    // 1. Mobile drawer fullscreen (17)
    // Strategy: load app desktop, load example, resize to mobile, screenshot
    {
      console.log('📸 17-mobile-drawer-fullscreen...');
      const page = await browser.newPage();
      // Start desktop to avoid drawer blocking
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await waitForHydration(page);
      // Load example on desktop (drawer visible as side panel)
      await loadExampleDesktop(page, 'nres-1x2');
      await page.waitForTimeout(500);
      // Resize to mobile — drawer becomes fixed inset-0 fullscreen
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '17-mobile-drawer-fullscreen.png'), fullPage: true });
      console.log('✅ Saved: 17-mobile-drawer-fullscreen.png');
      await page.close();
    }

    // 2. Mobile betbuilder legs (18)
    // Strategy: load desktop, click Builder tab, load example, resize mobile, screenshot
    {
      console.log('📸 18-mobile-betbuilder-legs...');
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await waitForHydration(page);
      // Click Bet Builder in desktop sidebar
      await clickTabDesktop(page, 'Bet Builder');
      await page.waitForTimeout(500);
      // Load example on desktop
      await loadExampleDesktop(page, 'poi-builder');
      await page.waitForTimeout(500);
      // Resize to mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      // Scroll to legs section
      const legsSection = page.locator('text=Pernas da combinada').first();
      if (await legsSection.count() > 0) {
        await legsSection.scrollIntoViewIfNeeded();
      }
      await page.screenshot({ path: path.join(OUTPUT_DIR, '18-mobile-betbuilder-legs.png'), fullPage: true });
      console.log('✅ Saved: 18-mobile-betbuilder-legs.png');
      await page.close();
    }

    // 3. Desktop focus states (17-desktop-focus-states)
    {
      console.log('📸 17-desktop-focus-states...');
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await waitForHydration(page);
      // Tab through elements to show focus
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }
      await page.screenshot({ path: path.join(OUTPUT_DIR, '17-desktop-focus-states.png'), fullPage: true });
      console.log('✅ Saved: 17-desktop-focus-states.png');
      await page.close();
    }

    // 4. Mobile wrong keyboard (18-mobile-wrong-keyboard)
    // Strategy: desktop click Builder tab, resize mobile, focus input
    {
      console.log('📸 18-mobile-wrong-keyboard...');
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await waitForHydration(page);
      // Close drawer first (click "Ocultar resultado")
      const closeBtn = page.locator('button:has-text("Ocultar resultado")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
      // Click Bet Builder tab on desktop
      await clickTabDesktop(page, 'Bet Builder');
      await page.waitForTimeout(500);
      // Resize to mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      // Focus first odds input (Casa 1)
      const oddInput = page.locator('input[placeholder*="1,80"], input[placeholder*="1.80"]').first();
      if (await oddInput.count() > 0) {
        await oddInput.click({ force: true });
      } else {
        // fallback: first text input
        await page.locator('input[type="text"]').first().click({ force: true });
      }
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '18-mobile-wrong-keyboard.png'), fullPage: true });
      console.log('✅ Saved: 18-mobile-wrong-keyboard.png');
      await page.close();
    }

    console.log('\n✅ Missing screenshots captured!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();