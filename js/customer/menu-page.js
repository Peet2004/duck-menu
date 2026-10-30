/* js/customer/menu-page.js — หน้าเมนู: แถบหมวดหมู่ซ้าย + หัวข้อ + การ์ดเมนู + สุ่มเมนู */
import { $, esc, fmtNum, reduced, sleep } from '../shared/utils.js';
import { ICONS } from '../shared/icons.js';
import { artSVG } from '../shared/artwork.js';
import { CATEGORIES, CAT } from '../shared/categories.js';
import { state, itemsOf, visibleList } from './menu-store.js';
import { mediaHTML, priceHTML, cardPriceHTML } from './card-parts.js';
import { burst, bindTilt } from './effects.js';

let els;
let hooks = { onOpen() {}, onRetry() {} };

/* ---------- แจ้งเตือนบนหน้า ---------- */
export function showNotice(msg, retry = false) {
  if (!msg) { els.notice.hidden = true; els.notice.innerHTML = ''; return; }
  els.notice.hidden = false;
  els.notice.innerHTML = `<span>${esc(msg)}</span>${retry ? '<button type="button" data-retry>ลองใหม่</button>' : ''}`;
}

/* ---------- การ์ดเมนู ---------- */
function cardHTML(item, i) {
  const sold = !item.available;
  const label = `${item.name}${item.price != null ? ' ราคา ' + fmtNum(item.price) + ' บาท' : ''}${item.hasSpecial ? ' พิเศษ ' + fmtNum(item.price + item.specialExtra) + ' บาท' : ''}`;
  return `<li style="--i:${i}">
    <button class="card${sold ? ' is-sold' : ''}" type="button" data-uid="${item.uid}" aria-label="${esc(label)}">
      <span class="media">
        ${mediaHTML(item)}
        ${item.featured ? `<span class="badge">${ICONS.star}แนะนำ</span>` : ''}
        ${sold ? '<span class="sold"><span>หมดชั่วคราว</span></span>' : ''}
        <span class="shine"></span>
      </span>
      <span class="info">
        <span class="name">${esc(item.name)}</span>
        <span class="desc">${esc(item.desc)}</span>
        <span class="foot">${cardPriceHTML(item)}<span class="go">${ICONS.arrow}</span></span>
      </span>
    </button>
  </li>`;
}

export function skeletonHTML() {
  const one = i => `<li style="--i:${i}"><div class="card"><span class="media"></span><span class="info"><span class="bar w60"></span><span class="bar w90"></span><span class="bar w40"></span></span></div></li>`;
  return `<ul class="grid sk" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(one).join('')}</ul>`;
}

export function showSkeleton() {
  renderCounts();
  renderHead(false);
  els.gridWrap.innerHTML = skeletonHTML();
  positionIndicator();
}

function renderHead(animate) {
  const c = CAT[state.cat];
  const list = itemsOf(state.cat);
  const prices = list.filter(i => i.available && i.price != null).map(i => i.price);
  const range = prices.length
    ? (Math.min(...prices) === Math.max(...prices) ? fmtNum(prices[0]) : `${fmtNum(Math.min(...prices))} – ${fmtNum(Math.max(...prices))}`)
    : '';
  const hasFeat = list.some(i => i.featured);
  const canRoll = list.filter(i => i.available).length >= 2;

  els.head.innerHTML = `
    <div class="head-text">
      <h1>${esc(c.label)}</h1>
      <p class="sub">${esc(c.sub)}${list.length ? ` · ${list.length} รายการ` : ''}${range ? ` · ราคา ${range} บาท` : ''}</p>
    </div>
    <div class="tools">
      ${hasFeat ? `<div class="chips" role="group" aria-label="กรองเมนู">
        <button class="chip" type="button" data-chip="all" aria-pressed="${!state.featuredOnly}">ทั้งหมด</button>
        <button class="chip" type="button" data-chip="featured" aria-pressed="${state.featuredOnly}">${ICONS.star}แนะนำ</button>
      </div>` : ''}
      ${canRoll ? `<button class="dice-btn" type="button" data-random>${ICONS.dice}<span>สุ่มเมนู</span></button>` : ''}
    </div>`;

  if (animate && !reduced) {
    els.head.classList.remove('swap');
    void els.head.offsetWidth;
    els.head.classList.add('swap');
  }
}

function renderGrid() {
  const list = visibleList();
  if (!list.length) {
    els.gridWrap.innerHTML = `<div class="empty"><span class="art">${artSVG(state.cat)}</span><strong>ยังไม่มีเมนูในหมวดนี้</strong><span>ลองดูหมวดอื่นทางด้านซ้าย</span></div>`;
    return;
  }
  els.gridWrap.innerHTML = `<ul class="grid" id="grid">${list.map((it, i) => cardHTML(it, i)).join('')}</ul>`;
  els.gridWrap.querySelectorAll('img').forEach(img => { if (img.complete && img.naturalWidth) img.classList.add('loaded'); });
  bindTilt(els.gridWrap);
}

function renderCounts() {
  CATEGORIES.forEach(c => {
    const el = $(`[data-count="${c.key}"]`);
    if (el) { const n = itemsOf(c.key).length; el.textContent = n; el.hidden = n === 0; }
  });
}

export function renderAll(animate = false) {
  renderCounts();
  renderHead(animate);
  renderGrid();
  positionIndicator();
}

/* ---------- แถบหมวดหมู่ ---------- */
function buildRail() {
  els.railIn.insertAdjacentHTML('beforeend', CATEGORIES.map(c =>
    `<button class="cat" type="button" data-cat="${c.key}" aria-current="false" aria-label="${esc(c.sub)}">
      <span class="count" data-count="${c.key}" hidden>0</span>${ICONS[c.key]}<span class="lbl">${esc(c.label)}</span>
    </button>`).join(''));
}

/* แถบหมวดหมู่เป็นแนวนอนบนมือถือ (flex-direction: row) และแนวตั้งบนจอใหญ่ */
const isHorizontalRail = () => getComputedStyle(els.railIn).flexDirection === 'row';

export function positionIndicator({ center = false } = {}) {
  const btn = $(`.cat[data-cat="${state.cat}"]`, els.railIn);
  if (!btn) return;
  els.railIn.querySelectorAll('.cat').forEach(b => b.setAttribute('aria-current', String(b === btn)));
  const ind = els.indicator;
  if (isHorizontalRail()) {
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.height = btn.offsetHeight + 'px';
    ind.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    if (center) {
      // เลื่อนแท็บที่เลือกให้อยู่กลางแถบ เพื่อให้เห็นหมวดข้างเคียง
      const rail = els.railIn.parentElement;
      const left = btn.offsetLeft - (rail.clientWidth - btn.offsetWidth) / 2;
      rail.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' });
    }
  } else {
    ind.style.width = '';
    ind.style.height = btn.offsetHeight + 'px';
    ind.style.transform = `translateY(${btn.offsetTop}px)`;
  }
  if (!ind.classList.contains('ready')) requestAnimationFrame(() => ind.classList.add('ready'));
}

export function setCategory(key, { pop = true, scroll = true } = {}) {
  if (!CAT[key]) return;
  const changed = key !== state.cat;
  state.userPicked = true;
  state.cat = key;
  state.featuredOnly = false;
  renderHead(changed);
  renderGrid();
  positionIndicator({ center: true });
  try { history.replaceState(null, '', '#' + key); } catch { /* file:// ฯลฯ */ }
  if (pop) {
    const btn = $(`.cat[data-cat="${key}"]`, els.railIn);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
  }
  if (scroll && changed) {
    // มือถือ: แท็บหมวดติดอยู่ด้านบน เลื่อนมาหยุดใต้แท็บพอดี (ไม่เด้งกลับไปบนสุดจนเห็นแถบโลโก้ซ้ำ)
    const stop = isHorizontalRail() ? ($('.topbar')?.offsetHeight || 0) : 0;
    if (window.scrollY > stop) window.scrollTo({ top: stop, behavior: reduced ? 'auto' : 'smooth' });
  }
}

/* ---------- สุ่มเมนู ---------- */
async function randomPick() {
  if (state.rolling) return;
  const cards = [...els.gridWrap.querySelectorAll('.card:not(.is-sold)')];
  if (!cards.length) return;
  state.rolling = true;
  const btn = $('[data-random]', els.head);
  if (btn) { btn.disabled = true; btn.classList.add('rolling'); }

  const n = cards.length;
  const target = Math.floor(Math.random() * n);
  const steps = reduced ? 0 : 14 + Math.floor(Math.random() * 6);
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const idx = (((target - steps + i) % n) + n) % n;
    if (prev) prev.classList.remove('spot');
    if (!cards[idx].isConnected) { state.rolling = false; return; }
    prev = cards[idx];
    prev.classList.add('spot');
    if (!reduced) prev.closest('li').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (i < steps) await sleep(60 + Math.pow(i / steps, 2) * 280);
  }
  const win = cards[target];
  if (!win.isConnected) { state.rolling = false; return; }
  win.classList.add('picked');
  const r = win.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 24);
  await sleep(reduced ? 0 : 750);
  win.classList.remove('spot', 'picked');
  if (btn) { btn.disabled = false; btn.classList.remove('rolling'); }
  state.rolling = false;
  hooks.onOpen(Number(win.dataset.uid), { random: true });
}

/* ---------- เหตุการณ์ ---------- */
function bindEvents() {
  els.railIn.addEventListener('click', e => {
    const b = e.target.closest('.cat');
    if (b) setCategory(b.dataset.cat);
  });

  els.gridWrap.addEventListener('click', e => {
    const card = e.target.closest('.card[data-uid]');
    if (card) hooks.onOpen(Number(card.dataset.uid));
  });

  els.head.addEventListener('click', e => {
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      state.featuredOnly = chip.dataset.chip === 'featured';
      els.head.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      renderGrid();
      return;
    }
    if (e.target.closest('[data-random]')) randomPick();
  });

  els.notice.addEventListener('click', e => {
    if (e.target.closest('[data-retry]')) hooks.onRetry();
  });

  els.brand.addEventListener('click', () => {
    els.brand.classList.remove('wiggle'); void els.brand.offsetWidth; els.brand.classList.add('wiggle');
    const r = els.brand.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 14);
  });

  /* รูปโหลดสำเร็จ / โหลดไม่ได้ → แสดงภาพประกอบแทน */
  document.addEventListener('load', e => {
    if (e.target.tagName === 'IMG') e.target.classList.add('loaded');
  }, true);
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.dataset.cat) return;
    const art = document.createElement('span');
    art.className = 'art';
    art.innerHTML = artSVG(img.dataset.cat);
    img.replaceWith(art);
  }, true);

  window.addEventListener('resize', () => positionIndicator());
  if ('ResizeObserver' in window) new ResizeObserver(() => positionIndicator()).observe(els.railIn);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => positionIndicator({ center: true }));

  window.addEventListener('hashchange', () => {
    const k = location.hash.slice(1);
    if (CAT[k] && k !== state.cat) setCategory(k, { pop: false });
  });
}

export function initMenuPage({ onOpen, onRetry }) {
  hooks = { onOpen, onRetry };
  els = {
    brand: $('#brand'), railIn: $('#railIn'), indicator: $('#indicator'), notice: $('#notice'),
    head: $('#head'), gridWrap: $('#gridWrap'),
  };
  buildRail();
  bindEvents();
}
