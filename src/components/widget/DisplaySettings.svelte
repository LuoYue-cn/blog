<script lang="ts">
import { onMount } from 'svelte';
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getDefaultHue, getHue, setHue, getCardRadius, setCardRadius, getLayoutDensity, setLayoutDensity, getFontSize, setFontSize } from "@utils/setting-utils";
import type { LayoutDensity, FontSize } from "@utils/setting-utils";

let visible = false;
let container: HTMLDivElement;

onMount(() => {
  container = document.createElement('div');
  container.id = 'settings-modal-root';
  document.body.appendChild(container);
  window.addEventListener('toggle-settings', () => {
    visible = !visible;
    try { render(); } catch(e) { console.error('Settings error:', e); }
  });
  return () => { if (container.parentNode) container.parentNode.removeChild(container); };
});

function close() { visible = false; render(); }

// ===== State =====
let hue = getHue();
const defaultHue = getDefaultHue();
function resetHue() { hue = defaultHue; setHue(hue); render(); }

let cardRadius = getCardRadius();
let layoutDensity: LayoutDensity = getLayoutDensity();
let fontSize: FontSize = getFontSize();

let bgUrl = localStorage.getItem('bg-url') || '';
let bgBlur = parseInt(localStorage.getItem('bg-blur') || '0');
let cardOpacity = parseFloat(localStorage.getItem('card-opacity') || '1');
let cardBlur = parseInt(localStorage.getItem('card-blur') || '0');
let pageSize = parseInt(localStorage.getItem('page-size') || '8');

function applyCardStyle() {
  let el = document.getElementById('settings-card-style') as HTMLStyleElement;
  if (!el) { el = document.createElement('style'); el.id = 'settings-card-style'; document.head.appendChild(el); }
  el.textContent = `:root{--card-bg:rgba(255,255,255,${cardOpacity})}:root.dark{--card-bg:rgba(30,30,45,${cardOpacity})}.card-base{backdrop-filter:blur(${cardBlur}px);-webkit-backdrop-filter:blur(${cardBlur}px)}`;
  localStorage.setItem('card-opacity', String(cardOpacity));
  localStorage.setItem('card-blur', String(cardBlur));
}

function applyBg() {
  // Remove old layer
  const old = document.getElementById('bg-layer');
  if (old) old.remove();
  // Restore html bg
  document.documentElement.style.backgroundColor = '';

  if (bgUrl) {
    // Create a fixed layer behind everything but above html background
    const layer = document.createElement('div');
    layer.id = 'bg-layer';
    layer.style.cssText =
      `position:fixed;inset:0;z-index:-1;` +
      `background-image:url(${JSON.stringify(bgUrl)});` +
      `background-size:cover;background-position:center;background-attachment:fixed;`;
    // Put blur on a separate pseudo-layer so it doesn't affect content
    if (bgBlur > 0) {
      layer.style.filter = `blur(${bgBlur}px)`;
      layer.style.transform = 'scale(1.05)';  // hide blur edges
    }
    document.body.prepend(layer);
    // Make html bg transparent so the layer shows through
    document.documentElement.style.backgroundColor = 'transparent';
  }
  localStorage.setItem('bg-url', bgUrl);
  localStorage.setItem('bg-blur', String(bgBlur));
}

function setPageSize(v: number) { pageSize = v; localStorage.setItem('page-size', String(v)); window.dispatchEvent(new CustomEvent('page-size-changed')); }

// Update a slider's value display
function updateVal(sliderId: string, val: string) {
  const el = document.getElementById(sliderId + '-val');
  if (el) el.textContent = val;
}

function render() {
  if (!container) return;
  container.innerHTML = '';
  if (!visible) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35)';
  overlay.addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });

  const box = document.createElement('div');
  box.style.cssText = `background:var(--float-panel-bg);border-radius:var(--radius-large);width:440px;max-width:calc(100vw - 32px);max-height:calc(100vh - 40px);overflow-y:auto;padding:24px;box-shadow:0 8px 40px rgba(0,0,0,0.15)`;

  // Build content
  const S = (text: string) => {
    const el = document.createElement('div');
    el.innerHTML = text;
    return el;
  };

  // Header
  box.appendChild(S(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <span style="font-size:18px;font-weight:700;color:var(--deep-text)">显示设置</span>
    <button id="sc-close" style="width:32px;height:32px;border:none;border-radius:8px;background:var(--btn-regular-bg);color:var(--btn-content);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center">✕</button>
  </div>`));

  // Theme color
  box.appendChild(sectionHdr('主题色'));
  box.appendChild(rangeSlider('hue', hue, 0, 360, 5, '', 'linear-gradient(to right,oklch(0.80 0.10 0),oklch(0.80 0.10 60),oklch(0.80 0.10 120),oklch(0.80 0.10 180),oklch(0.80 0.10 240),oklch(0.80 0.10 300),oklch(0.80 0.10 360))'));

  // Card
  box.appendChild(sectionHdr('卡片外观'));
  box.appendChild(rangeSlider('radius', cardRadius, 0, 24, 1, 'px', 'oklch(0.80 0.05 250)'));
  box.appendChild(rangeSlider('opacity', Math.round(cardOpacity * 100), 30, 100, 1, '%', 'rgba(128,128,128,0.3)'));
  box.appendChild(rangeSlider('cardblur', cardBlur, 0, 30, 1, 'px', 'rgba(128,128,128,0.3)'));

  // Typography
  box.appendChild(sectionHdr('排版'));
  box.appendChild(choiceBtns('density-group', ['compact','normal','comfortable'], layoutDensity,
    ['紧凑','标准','舒适'], (v) => { layoutDensity = v as LayoutDensity; setLayoutDensity(v as LayoutDensity); render(); }));
  box.appendChild(choiceBtns('font-group', ['small','medium','large'], fontSize,
    ['小','中','大'], (v) => { fontSize = v as FontSize; setFontSize(v as FontSize); render(); }));

  // Background
  box.appendChild(sectionHdr('背景'));
  const bgRow = S(`<div style="margin-bottom:12px">
    <div style="font-size:13px;font-weight:600;color:var(--deep-text);margin-bottom:4px">背景图片 URL</div>
    <div style="display:flex;gap:6px">
      <input id="bg-input" type="text" value="${esc(bgUrl)}" placeholder="https://example.com/bg.jpg" style="flex:1;padding:7px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:13px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
      <button id="bg-clear" style="${IB}${!bgUrl?'visibility:hidden':''}">✕</button>
    </div>
  </div>`);
  box.appendChild(bgRow);
  box.appendChild(rangeSlider('bgblur', bgBlur, 0, 40, 1, 'px', 'rgba(128,128,128,0.3)'));

  // Pagination
  box.appendChild(sectionHdr('翻页'));
  box.appendChild(rangeSlider('pagesize', pageSize, 3, 30, 1, '', 'rgba(128,128,128,0.3)'));


  overlay.appendChild(box);
  container.appendChild(overlay);

  // === Bind events ===
  box.querySelector('#sc-close')?.addEventListener('click', close);

  // Range sliders: update display + apply
  function bindSlider(id: string, onChange: (v: number) => void) {
    const input = box.querySelector('#' + id) as HTMLInputElement;
    if (!input) return;
    input.addEventListener('input', () => {
      const v = input.valueAsNumber;
      const valSpan = document.getElementById(id + '-val');
      if (valSpan) valSpan.textContent = (input.dataset.suffix === '%' ? v + '%' : input.dataset.suffix ? v + input.dataset.suffix : String(v));
      onChange(v);
    });
    // Store suffix on the input for reference
    input.dataset.suffix = input.closest('[data-suffix]')?.getAttribute('data-suffix') || '';
  }

  // Set suffixes on the slider wrappers
  box.querySelectorAll('[data-sf]').forEach(el => {
    const input = el.querySelector('input[type="range"]') as HTMLInputElement;
    if (input) input.dataset.suffix = (el as HTMLElement).dataset.sf || '';
  });

  // Because rangeSlider attaches data-sf to the wrapper div, parse it in bindSlider
  // Actually easier: just hardcode the suffixes in the callbacks
  const sfMap: Record<string, string> = { hue:'', radius:'px', opacity:'%', cardblur:'px', bgblur:'px', pagesize:'' };

  // Re-bind with proper suffix handling
  function bindSlider2(id: string, onChange: (v: number) => void) {
    const input = box.querySelector('#' + id) as HTMLInputElement;
    if (!input) return;
    const suffix = sfMap[id] || '';
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      const valSpan = document.getElementById(id + '-val');
      if (valSpan) valSpan.textContent = suffix === '%' ? v + '%' : v + suffix;
      onChange(v);
    });
  }

  bindSlider2('hue', (v) => { hue = v; setHue(v); });
  bindSlider2('radius', (v) => { cardRadius = v; setCardRadius(v); });
  bindSlider2('opacity', (v) => { cardOpacity = v / 100; applyCardStyle(); });
  bindSlider2('cardblur', (v) => { cardBlur = v; applyCardStyle(); });
  bindSlider2('bgblur', (v) => { bgBlur = v; applyBg(); });
  bindSlider2('pagesize', (v) => { setPageSize(v); });

  // Background URL
  box.querySelector('#bg-input')?.addEventListener('change', (e) => {
    bgUrl = (e.target as HTMLInputElement).value;
    applyBg();
  });
  box.querySelector('#bg-clear')?.addEventListener('click', () => {
    bgUrl = '';
    applyBg();
    render();
  });

  applyCardStyle();
  applyBg();
}

// ===== Helpers =====
function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
const IB = 'width:28px;height:28px;border:none;border-radius:6px;background:var(--btn-regular-bg);color:var(--btn-content);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0';

function sectionHdr(label: string): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = 'font-size:12px;font-weight:700;color:var(--meta-divider);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line-divider)';
  d.textContent = label;
  return d;
}

function rangeSlider(id: string, val: number, min: number, max: number, step: number, suffix: string, bg: string): HTMLDivElement {
  const display = suffix === '%' ? val + '%' : val + suffix;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-bottom:12px';
  wrap.dataset.sf = suffix;
  wrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
    <span style="font-size:13px;font-weight:600;color:var(--deep-text)">${id === 'hue' ? '主题色' : id === 'radius' ? '圆角' : id === 'opacity' ? '透明度' : id === 'cardblur' ? '毛玻璃' : id === 'bgblur' ? '模糊' : id === 'pagesize' ? '每页文章数' : id}</span>
    <span id="${id}-val" style="background:var(--btn-regular-bg);color:var(--btn-content);font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;min-width:36px;text-align:center">${display}</span>
  </div>
  <input type="range" min="${min}" max="${max}" value="${val}" step="${step}" id="${id}" style="width:100%;height:20px;-webkit-appearance:none;background:${bg};border-radius:4px;cursor:pointer;outline:none">`;
  return wrap;
}

function choiceBtns(id: string, values: string[], active: string, labels: string[], onClick: (v: string) => void): HTMLDivElement {
  const d = document.createElement('div');
  d.id = id;
  d.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
  values.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.textContent = labels[i];
    btn.style.cssText = `flex:1;height:32px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;${v === active ? 'background:var(--primary);color:white' : 'background:var(--btn-regular-bg);color:var(--btn-content)'}`;
    btn.addEventListener('click', () => onClick(v));
    d.appendChild(btn);
  });
  return d;
}
</script>
