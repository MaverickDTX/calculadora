#!/usr/bin/env node

// WCAG 2.1 Contrast Audit for Kelly Stake Pro
// Reads colors from index.css and tests against backgrounds #0B0F17 / #111827

function srgbToLinear(c) {
  const c8 = c / 255;
  return c8 <= 0.03928 ? c8 / 12.92 : Math.pow((c8 + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return clean.split('').map(c => parseInt(c + c, 16));
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function parseRgba(str) {
  const match = str.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(',').map(s => s.trim());
  const r = parseInt(parts[0]);
  const g = parseInt(parts[1]);
  const b = parseInt(parts[2]);
  const a = parts[3] ? parseFloat(parts[3]) : 1;
  return { r, g, b, a };
}

function blendOver(fg, bg) {
  if (!fg.a || fg.a === 1) return fg;
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  };
}

function blendRgbaOnOpaque(fg, bgOpaque) {
  if (!fg.a || fg.a === 1) return fg;
  return blendOver(fg, { ...bgOpaque, a: 1 });
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function passesAA(ratio, isLargeText) {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function passesAAA(ratio, isLargeText) {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

function formatRatio(r) {
  return `${r.toFixed(2)}:1`;
}

const HEX_BG = {
  primary: { r: 0x0B, g: 0x0F, b: 0x17 },
  panel: { r: 0x11, g: 0x18, b: 0x27 },
};

function getEffectiveBg(bgStr) {
  if (typeof bgStr !== 'string') return HEX_BG.panel;
  if (bgStr.startsWith('#')) {
    const [r, g, b] = hexToRgb(bgStr);
    return { r, g, b, a: 1 };
  }
  if (bgStr.startsWith('rgba')) {
    const fgTransparent = parseRgba(bgStr);
    return blendRgbaOnOpaque(fgTransparent, HEX_BG.primary);
  }
  if (bgStr === 'transparent') {
    return HEX_BG.panel;
  }
  return HEX_BG.panel;
}

const BG_PRIMARY_HEX = '#0B0F17';
const BG_PANEL_HEX = '#111827';

const BG_PRIMARY = '#0B0F17';
const BG_PANEL = '#111827';
const BG_PANEL_RGBA = 'rgba(17, 24, 39, 0.72)';
const BG_INPUT = 'rgba(11, 15, 23, 0.65)';
const BG_INPUT_FOCUS = 'rgba(11, 15, 23, 0.85)';
const BG_STAKE = 'rgba(30, 27, 75, 0.7)';
const BG_METRIC = 'rgba(17, 24, 39, 0.65)';
const BG_QUALITY_GOOD = 'rgba(16, 185, 129, 0.06)';
const BG_QUALITY_MID = 'rgba(245, 158, 11, 0.06)';
const BG_QUALITY_BAD = 'rgba(239, 68, 68, 0.06)';
const BG_TAG_VALUE = 'rgba(16, 185, 129, 0.12)';
const BG_TAG_WARN = 'rgba(245, 158, 11, 0.12)';
const BG_TAG_DANGER = 'rgba(239, 68, 68, 0.12)';
const BG_TAG_INFO = 'rgba(56, 189, 248, 0.12)';
const BG_TAG_KELLY = 'rgba(139, 92, 246, 0.12)';
const BG_TAG_ACCENT = 'rgba(99, 102, 241, 0.15)';
const BG_BTN_PRIMARY = '#6366F1';
const BG_BTN_GHOST_HOVER = '#1F2937';
const BG_NAV_SELECTED = 'rgba(99, 102, 241, 0.15)';

const PAIRS = [
  // Body text
  { fg: '#F9FAFB', bg: BG_PRIMARY, size: 14, weight: 400, ctx: 'Body text on primary bg' },
  { fg: '#F9FAFB', bg: BG_PANEL, size: 14, weight: 400, ctx: 'Body text on panel bg' },
  
  // Small labels (CRITICAL - 11px uppercase)
  { fg: '#6B7280', bg: BG_PRIMARY, size: 11, weight: 500, ctx: '.metric-label (11px uppercase) on primary' },
  { fg: '#6B7280', bg: BG_PANEL, size: 11, weight: 500, ctx: '.metric-label on panel' },
  { fg: '#6B7280', bg: BG_PRIMARY, size: 11, weight: 600, ctx: '.section-title (11px uppercase)' },
  { fg: '#6B7280', bg: BG_INPUT, size: 14, weight: 400, ctx: '.input-dark::placeholder' },
  
  // Tags
  { fg: '#10B981', bg: BG_TAG_VALUE, size: 11, weight: 600, ctx: '.tag-value' },
  { fg: '#F59E0B', bg: BG_TAG_WARN, size: 11, weight: 600, ctx: '.tag-warn ⚠️ CRITICAL' },
  { fg: '#EF4444', bg: BG_TAG_DANGER, size: 11, weight: 600, ctx: '.tag-danger' },
  { fg: '#38BDF8', bg: BG_TAG_INFO, size: 11, weight: 600, ctx: '.tag-info' },
  { fg: '#8B5CF6', bg: BG_TAG_KELLY, size: 11, weight: 600, ctx: '.tag-kelly' },
  
  // Inputs
  { fg: '#F9FAFB', bg: BG_INPUT, size: 14, weight: 400, ctx: '.input-dark text' },
  { fg: '#6366F1', bg: BG_INPUT_FOCUS, size: 14, weight: 400, ctx: '.input-dark:focus border' },
  
  // Buttons
  { fg: '#FFFFFF', bg: BG_BTN_PRIMARY, size: 13, weight: 600, ctx: '.btn-primary' },
  { fg: '#9CA3AF', bg: 'transparent', size: 13, weight: 500, ctx: '.btn-ghost text (on panel)' },
  { fg: '#F9FAFB', bg: BG_BTN_GHOST_HOVER, size: 13, weight: 500, ctx: '.btn-ghost:hover' },
  
  // Navigation
  { fg: '#9CA3AF', bg: 'transparent', size: 13, weight: 500, ctx: '.nav-item text (on panel)' },
  { fg: '#F9FAFB', bg: BG_BTN_GHOST_HOVER, size: 13, weight: 500, ctx: '.nav-item:hover' },
  { fg: '#818CF8', bg: BG_NAV_SELECTED, size: 13, weight: 600, ctx: '.nav-item[aria-selected]' },
  
  // Metric cards
  { fg: '#F9FAFB', bg: BG_METRIC, size: 22, weight: 600, ctx: '.metric-value (large text)' },
  { fg: '#10B981', bg: BG_METRIC, size: 22, weight: 600, ctx: '.metric-value.highlight.good' },
  { fg: '#EF4444', bg: BG_METRIC, size: 22, weight: 600, ctx: '.metric-value.highlight.bad' },
  { fg: '#8B5CF6', bg: BG_METRIC, size: 22, weight: 600, ctx: '.metric-value.highlight.kelly' },
  
  // Stake display
  { fg: '#FFFFFF', bg: BG_STAKE, size: 32, weight: 700, ctx: '.stake-display main value' },
  { fg: '#818CF8', bg: BG_STAKE, size: 14, weight: 500, ctx: '.stake-display unit text' },
  
  // Quality badges
  { fg: '#10B981', bg: BG_QUALITY_GOOD, size: 14, weight: 500, ctx: '.quality-good border/label' },
  { fg: '#F59E0B', bg: BG_QUALITY_MID, size: 14, weight: 500, ctx: '.quality-mid border/label' },
  { fg: '#EF4444', bg: BG_QUALITY_BAD, size: 14, weight: 500, ctx: '.quality-bad border/label' },
  
  // Divider / borders (UI components - 3:1)
  { fg: '#374151', bg: BG_PRIMARY, size: 1, weight: 400, ctx: '.divider / borders (UI component)' },
  { fg: '#374151', bg: BG_PANEL, size: 1, weight: 400, ctx: 'Panel borders' },
  { fg: '#6366F1', bg: BG_PRIMARY, size: 1, weight: 400, ctx: 'Focus ring color on primary' },
  { fg: '#6366F1', bg: BG_PANEL, size: 1, weight: 400, ctx: 'Focus ring color on panel' },
];

console.log('fg_hex,bg_hex,font_size_px,font_weight,context,ratio,aa_normal,aa_large,aaa_normal,aaa_large,ui_component,status');
console.log('---');

let criticalFails = 0;
let warns = 0;
let passes = 0;

for (const pair of PAIRS) {
  const fgRgb = hexToRgb(pair.fg);
  const bgEff = getEffectiveBg(pair.bg);
  
  const l1 = rgbToLuminance([fgRgb[0], fgRgb[1], fgRgb[2]]);
  const l2 = rgbToLuminance([bgEff.r, bgEff.g, bgEff.b]);
  const ratio = contrastRatio(l1, l2);
  
  const isLargeText = pair.size >= 18 || (pair.size >= 14 && pair.weight >= 700);
  const isUiComponent = pair.ctx.includes('UI component') || pair.ctx.includes('border') || pair.ctx.includes('Focus ring');
  
  const aaNormal = passesAA(ratio, false);
  const aaLarge = passesAA(ratio, true);
  const aaaNormal = passesAAA(ratio, false);
  const aaaLarge = passesAAA(ratio, true);
  const uiPass = ratio >= 3;
  
  const textPass = isLargeText ? aaLarge : aaNormal;
  const overallPass = isUiComponent ? uiPass : textPass;
  
  let status = overallPass ? '✅ PASS' : '❌ FAIL';
  if (!overallPass) {
    if (pair.ctx.includes('CRITICAL') || pair.size <= 11) criticalFails++;
    else warns++;
  } else {
    passes++;
  }
  
  console.log(
    `"${pair.fg}","${pair.bg}",${pair.size},${pair.weight},"${pair.ctx}",` +
    `"${formatRatio(ratio)}",${aaNormal},${aaLarge},${aaaNormal},${aaaLarge},${uiPass},"${status}"`
  );
}

console.log('\n--- SUMMARY ---');
console.log(`✅ PASS: ${passes}`);
console.log(`⚠️  WARN (AA fail, not critical): ${warns}`);
console.log(`❌ CRITICAL FAIL (AA fail, small text): ${criticalFails}`);
console.log(`Total: ${PAIRS.length}`);

// Output key failures for report
console.log('\n--- KEY FAILURES FOR REPORT ---');
for (const pair of PAIRS) {
  const fgRgb = hexToRgb(pair.fg);
  const bgEff = getEffectiveBg(pair.bg);
  const l1 = rgbToLuminance([fgRgb[0], fgRgb[1], fgRgb[2]]);
  const l2 = rgbToLuminance([bgEff.r, bgEff.g, bgEff.b]);
  const ratio = contrastRatio(l1, l2);
  const isLargeText = pair.size >= 18 || (pair.size >= 14 && pair.weight >= 700);
  const textPass = isLargeText ? passesAA(ratio, true) : passesAA(ratio, false);
  const isUiComponent = pair.ctx.includes('UI component') || pair.ctx.includes('border') || pair.ctx.includes('Focus ring');
  const overallPass = isUiComponent ? ratio >= 3 : textPass;
  
  if (!overallPass) {
    const severity = (pair.ctx.includes('CRITICAL') || pair.size <= 11) ? 'CRÍTICO' : 'MÉDIO';
    console.log(`${severity}: ${pair.ctx} — ${formatRatio(ratio)} (${isLargeText ? 'large' : 'normal'} text, ${pair.size}px ${pair.weight})`);
  }
}