/* js/customer/item-detail.js — popup รายละเอียดเมนู: เลือก ธรรมดา/พิเศษ + add-on + จำนวน แล้วกด "เพิ่มอาหาร" */
import { $, esc, fmtNum, baht, reduced, toast } from '../shared/utils.js';
import { CONFIG } from '../shared/config.js';
import { ICONS } from '../shared/icons.js';
import { CAT } from '../shared/categories.js';
import { addonsFor } from '../shared/menu-source.js';
import { unitPrice, SIZE_LABEL } from '../shared/pricing.js';
import { state, visibleList } from './menu-store.js';
import { addLine } from './cart-store.js';
import { mediaHTML, priceHTML } from './card-parts.js';
import { burst } from './effects.js';

let dlg;

/* สถานะของเมนูที่กำลังเปิดดู */
const modal = { list: [], index: 0, randomUid: null, size: 'normal', picked: new Set(), qty: 1, addons: [] };
const current = () => modal.list[modal.index];
const chosenAddons = () => modal.addons.filter(a => modal.picked.has(a.name));
const orderable = item => item.available && item.price != null;

function countUp(el, to) {
  cancelAnimationFrame(el._raf);
  const from = Number(el.dataset.cur ?? to);
  el.dataset.cur = to;
  if (reduced || from === to) { el.textContent = fmtNum(to); return; }
  const t0 = performance.now(), dur = 450;
  const tick = t => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = p < 1 ? fmtNum(Math.round(from + (to - from) * e)) : fmtNum(to);
    if (p < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}

/* อัปเดตราคา/จำนวนในหน้าต่างโดยไม่วาดใหม่ทั้งหมด */
function refreshOptions() {
  const item = current();
  if (!orderable(item)) return;
  const unit = unitPrice(item, modal.size, chosenAddons());
  countUp($('[data-num]', dlg), unit);
  $('[data-total]', dlg).textContent = baht(unit * modal.qty);
  $('[data-qty-val]', dlg).textContent = modal.qty;
  dlg.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === modal.size)));
  dlg.querySelectorAll('[data-addon]').forEach(b => b.setAttribute('aria-pressed', String(modal.picked.has(b.dataset.addon))));
  $('[data-qty="-1"]', dlg).disabled = modal.qty <= 1;
  $('[data-qty="1"]', dlg).disabled = modal.qty >= CONFIG.MAX_QTY;
}

function sizeHTML(item) {
  return `<div class="opt-group" role="group" aria-label="เลือกแบบ">
    <div class="opt-title">เลือกแบบ</div>
    <div class="seg">
      <button class="seg-btn" type="button" data-size="normal" aria-pressed="true"><span>${SIZE_LABEL.normal}</span><b>${baht(item.price)}</b></button>
      <button class="seg-btn" type="button" data-size="special" aria-pressed="false"><span>${SIZE_LABEL.special}</span><b>${baht(item.price + item.specialExtra)}</b><small>+${fmtNum(item.specialExtra)}</small></button>
    </div>
  </div>`;
}

function addonHTML(addons) {
  return `<div class="opt-group" role="group" aria-label="เพิ่มเติม">
    <div class="opt-title">เพิ่มเติม <small>เลือกได้หลายอย่าง</small></div>
    <div class="addon-list">${addons.map(a =>
      `<button class="addon" type="button" data-addon="${esc(a.name)}" aria-pressed="false">
        <span class="chk">${ICONS.check}</span><span class="a-name">${esc(a.name)}</span><span class="a-price">+${fmtNum(a.price)}</span>
      </button>`).join('')}</div>
  </div>`;
}

function fillDetail(dir = 0) {
  const item = current();
  const c = CAT[item.cat];
  const n = modal.list.length;
  const ok = orderable(item);

  modal.size = 'normal';
  modal.picked = new Set();
  modal.qty = 1;
  modal.addons = ok ? addonsFor(item, state.addons) : [];

  dlg.innerHTML = `
    <div class="d-view ${dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : ''}">
      <button class="d-close" type="button" data-close aria-label="ปิด">${ICONS.close}</button>
      <div class="d-media">
        ${mediaHTML(item)}
        ${item.featured ? `<span class="badge">${ICONS.star}แนะนำ</span>` : ''}
        ${item.available ? '' : '<span class="sold"><span>หมดชั่วคราว</span></span>'}
        ${n > 1 ? `<button class="m-nav prev" type="button" data-prev aria-label="เมนูก่อนหน้า">${ICONS.left}</button>
        <button class="m-nav next" type="button" data-next aria-label="เมนูถัดไป">${ICONS.right}</button>
        <span class="m-count">${modal.index + 1} / ${n}</span>` : ''}
      </div>
      <div class="d-body">
        <div class="d-tags"><span class="tag">${esc(c.label)}</span>${modal.randomUid === item.uid ? '<span class="tag hot">เมนูที่สุ่มได้</span>' : ''}</div>
        <h2 class="d-name" id="dName">${esc(item.name)}</h2>
        ${item.desc ? `<p class="d-desc">${esc(item.desc)}</p>` : ''}
        <div class="d-price">${priceHTML(item)}${item.available ? '' : '<p class="d-sold">เมนูนี้หมดชั่วคราว</p>'}</div>
        ${ok && item.hasSpecial ? sizeHTML(item) : ''}
        ${ok && modal.addons.length ? addonHTML(modal.addons) : ''}
        <div class="d-foot">
          ${ok ? `<div class="qty-row">
              <span class="opt-title">จำนวน</span>
              <div class="qty"><button type="button" data-qty="-1" aria-label="ลดจำนวน">${ICONS.minus}</button><span data-qty-val>1</span><button type="button" data-qty="1" aria-label="เพิ่มจำนวน">${ICONS.plus}</button></div>
            </div>
            <button class="add-btn" type="button" data-add><span>เพิ่มอาหาร</span><b data-total>${baht(item.price)}</b></button>`
          : `<button class="add-btn" type="button" disabled><span>${item.available ? 'สอบถามราคาที่ร้าน' : 'หมดชั่วคราว'}</span></button>`}
        </div>
      </div>
    </div>`;
  dlg.querySelectorAll('img').forEach(img => { if (img.complete && img.naturalWidth) img.classList.add('loaded'); });
  const num = $('[data-num]', dlg);
  if (num) { num.dataset.cur = item.price; }
  refreshOptions();
}

export function openDetail(uid, { random = false } = {}) {
  modal.list = visibleList();
  modal.index = Math.max(0, modal.list.findIndex(i => i.uid === uid));
  modal.randomUid = random ? uid : null;
  fillDetail(0);
  if (!dlg.open) {
    document.documentElement.classList.add('lock');
    dlg.showModal();
  }
}

function stepDetail(delta) {
  const n = modal.list.length;
  if (n < 2) return;
  modal.index = (modal.index + delta + n) % n;
  fillDetail(delta);
  const b = $(delta > 0 ? '[data-next]' : '[data-prev]', dlg);
  if (b) b.focus({ preventScroll: true });
}

export function closeDetail() {
  if (!dlg.open || dlg.classList.contains('closing')) return;
  const done = () => { dlg.classList.remove('closing'); dlg.close(); };
  if (reduced) return done();
  dlg.classList.add('closing');
  setTimeout(done, 230);
}

function addToOrder(btn) {
  const item = current();
  if (!orderable(item)) return;
  addLine({ item, size: modal.size, addons: chosenAddons(), qty: modal.qty });
  toast(`เพิ่ม ${item.name}${modal.qty > 1 ? ' ×' + modal.qty : ''} ลงออเดอร์แล้ว`);
  const r = btn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top, 14);
  closeDetail();
}

export function initItemDetail() {
  dlg = $('#detail');

  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) return closeDetail();
    if (e.target.closest('[data-prev]')) return stepDetail(-1);
    if (e.target.closest('[data-next]')) return stepDetail(1);

    const size = e.target.closest('[data-size]');
    if (size) { modal.size = size.dataset.size; return refreshOptions(); }

    const addon = e.target.closest('[data-addon]');
    if (addon) {
      const name = addon.dataset.addon;
      modal.picked.has(name) ? modal.picked.delete(name) : modal.picked.add(name);
      return refreshOptions();
    }

    const qty = e.target.closest('[data-qty]');
    if (qty) {
      modal.qty = Math.min(CONFIG.MAX_QTY, Math.max(1, modal.qty + Number(qty.dataset.qty)));
      return refreshOptions();
    }

    const add = e.target.closest('[data-add]');
    if (add) addToOrder(add);
  });

  dlg.addEventListener('cancel', e => { e.preventDefault(); closeDetail(); });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('lock'));
  document.addEventListener('keydown', e => {
    if (!dlg.open) return;
    if (e.key === 'ArrowRight') stepDetail(1);
    if (e.key === 'ArrowLeft') stepDetail(-1);
  });

  /* ปัดซ้าย-ขวาที่รูปเพื่อดูเมนูอื่น */
  let sx = 0, sy = 0, swiping = false;
  dlg.addEventListener('pointerdown', e => {
    swiping = !!e.target.closest('.d-media') && !e.target.closest('button');
    sx = e.clientX; sy = e.clientY;
  });
  dlg.addEventListener('pointerup', e => {
    if (!swiping) return;
    swiping = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) stepDetail(dx < 0 ? 1 : -1);
  });
  dlg.addEventListener('pointercancel', () => { swiping = false; });
}
