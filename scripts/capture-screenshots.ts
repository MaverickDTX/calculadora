import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://calculadora-gray-one.vercel.app/';
const OUTPUT_DIR = path.join('C:', 'Projetos', 'calculadora', 'screenshots');

interface Scenario {
  name: string;
  tab: string;
  state: 'empty' | 'example' | 'config-modal' | 'viz';
  example?: string;
  mobile?: boolean;
  viz?: boolean;
}

const SCENARIOS: Scenario[] = [
  { name: '01-desktop-inicial-nres', tab: 'nres', state: 'empty' },
  { name: '02-desktop-nres-com-resultado', tab: 'nres', state: 'example', example: 'nres-1x2' },
  { name: '03-desktop-props', tab: 'props', state: 'empty' },
  { name: '04-desktop-props-com-resultado', tab: 'props', state: 'example', example: 'prop-anytime' },
  { name: '05-desktop-proxy', tab: 'proxy', state: 'empty' },
  { name: '06-desktop-proxy-com-resultado', tab: 'proxy', state: 'example', example: 'proxy-single' },
  { name: '07-desktop-aub', tab: 'aub', state: 'empty' },
  { name: '08-desktop-aub-com-resultado', tab: 'aub', state: 'example', example: 'aub-basic' },
  { name: '09-desktop-combo', tab: 'combo', state: 'empty' },
  { name: '10-desktop-combo-com-resultado', tab: 'combo', state: 'example', example: 'combo-boost' },
  { name: '11-desktop-betbuilder', tab: 'poi', state: 'empty' },
  { name: '12-desktop-betbuilder-com-resultado', tab: 'poi', state: 'example', example: 'poi-builder' },
  { name: '13-desktop-asia', tab: 'asia', state: 'empty' },
  { name: '14-desktop-config-modal', tab: 'nres', state: 'config-modal' },
  { name: '15-desktop-vizsection', tab: 'nres', state: 'example', example: 'nres-1x2', viz: true },
  { name: '16-mobile-bottom-nav', tab: 'nres', state: 'empty', mobile: true },
  { name: '17-mobile-drawer-fullscreen', tab: 'nres', state: 'example', example: 'nres-1x2', mobile: true },
  { name: '18-mobile-betbuilder-legs', tab: 'poi', state: 'example', example: 'poi-builder', mobile: true },
];

const TAB_LABELS: Record<string, string> = {
  nres: 'N Resultados',
  props: 'Props',
  proxy: 'Proxy',
  aub: 'A ou B',
  combo: 'Combinada',
  poi: 'Bet Builder',
  asia: 'Asiáticos',
};

const TAB_SHORT: Record<string, string> = {
  nres: 'N Res.',
  props: 'Props',
  proxy: 'Proxy',
  aub: 'A/B',
  combo: 'Combo',
  poi: 'Builder',
  asia: 'Asiát.',
};

async function waitForHydration(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function clickTab(page: Page, tabId: string, isMobile: boolean) {
  const label = isMobile ? (TAB_SHORT[tabId] || TAB_LABELS[tabId]) : TAB_LABELS[tabId];
  if (!label) throw new Error(`Unknown tab: ${tabId}`);

  if (isMobile) {
    const mobileNav = page.locator('.md\\:hidden');
    await mobileNav.locator(`button:has-text("${label}")`).click();
  } else {
    const sidebar = page.locator('aside');
    await sidebar.locator(`button:has-text("${label}")`).first().click();
  }
  await page.waitForTimeout(300);
}

async function loadExample(page: Page, exampleKey: string) {
  const exampleButtons = page.locator('.btn-ghost, button[class*="btn-ghost"]');
  const count = await exampleButtons.count();
  
  for (let i = 0; i < count; i++) {
    const btn = exampleButtons.nth(i);
    const text = await btn.textContent();
    if (text) {
      const normalized = text.toLowerCase().replace(/\s+/g, '-');
      if (normalized.includes(exampleKey.toLowerCase()) || 
          (exampleKey === 'nres-1x2' && text.includes('1X2')) ||
          (exampleKey === 'poi-builder' && text.includes('Over')) ||
          (exampleKey === 'combo-boost' && text.includes('4 pernas'))) {
        await btn.click();
        await page.waitForTimeout(800);
        return true;
      }
    }
  }
  
  const allButtons = page.locator('button');
  const allCount = await allButtons.count();
  for (let i = 0; i < allCount; i++) {
    const btn = allButtons.nth(i);
    const text = await btn.textContent();
    if (text && (text.includes('Exemplo') || text.includes('exemplo'))) {
      await btn.click();
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function openConfigModal(page: Page) {
  const configBtn = page.locator('button:has-text("Configurações"), button:has([class*="Settings"])').first();
  await configBtn.click();
  await page.waitForTimeout(300);
}

async function waitForResult(page: Page) {
  await page.waitForSelector('[class*="ResultsDrawer"], [class*="Drawer"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function runScenario(browser: Browser, scenario: Scenario) {
  const page = await browser.newPage();
  const viewport = scenario.mobile 
    ? { width: 390, height: 844 } 
    : { width: 1440, height: 900 };
  
  await page.setViewportSize(viewport);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForHydration(page);

  if (scenario.tab !== 'nres' || scenario.state !== 'empty') {
    await clickTab(page, scenario.tab, scenario.mobile || false);
  }

  if (scenario.state === 'example' && scenario.example) {
    await loadExample(page, scenario.example);
    await waitForResult(page);
  } else if (scenario.state === 'config-modal') {
    await openConfigModal(page);
  }

  if (scenario.viz) {
    await page.waitForSelector('[class*="VizSection"], [class*="MonteCarlo"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  const outputPath = path.join(OUTPUT_DIR, `${scenario.name}.png`);
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`✅ Saved: ${outputPath}`);
  
  await page.close();
}

async function runFocusTest(browser: Browser) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForHydration(page);
  
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
  }
  
  const outputPath = path.join(OUTPUT_DIR, '17-desktop-focus-states.png');
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`✅ Saved: ${outputPath}`);
  
  await page.close();
}

async function runMobileKeyboardTest(browser: Browser) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForHydration(page);
  
  await clickTab(page, 'poi', true);
  await page.waitForTimeout(500);
  
  const oddInput = page.locator('input[placeholder*="1,80"], input[placeholder*="1.80"]').first();
  await oddInput.click();
  await page.waitForTimeout(300);
  
  const outputPath = path.join(OUTPUT_DIR, '18-mobile-wrong-keyboard.png');
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`✅ Saved: ${outputPath}`);
  
  await page.close();
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const scenario of SCENARIOS) {
      await runScenario(browser, scenario);
    }
    
    await runFocusTest(browser);
    await runMobileKeyboardTest(browser);
    
    console.log('\n✅ All screenshots captured successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();