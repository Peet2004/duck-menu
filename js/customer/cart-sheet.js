/* js/customer/cart-sheet.js — หน้าต่างออเดอร์: ดูรายการที่เลือก แก้จำนวน แล้วกดแถบ "สั่งอาหาร" ด้านล่าง */
import { $, esc, baht, uuid } from '../shared/utils.js';
import { CONFIG } from '../shared/config.js';
import { ICONS } from '../shared/icons.js';
import { cartTotal, lineTotal, optionText } from '../shared/pricing.js';
import { submitOrder } from '../shared/orders-api.js';
import { state, isTrustedSource, canOrder } from './menu-store.js';
import { getLines, setQty, removeLine, clearCart, subscribe, syncWithMenu } from './cart-store.js';

let dlg, els;
let hooks = { onSubmitted() {} };
let sending = false;
let clientId = null;           // รหัสกันส่งซ้ำ: ส่งซ้ำด้วยรหัสเดิมจะได้ออเดอร์เดิม ไม่ซ้ำสองใบ
const form = { customer: '', note: '' };

function skeleton() {
  dlg.innerHTML = `
    <div class="sheet-view">
      <header class="sheet-head">
        <h2 id="cartTitle">ออเดอร์ของคุณ</h2>
        <button class="sheet-close" type="button" data-close aria-label="ปิด">${ICONS.close}</button>
      </header>
      <div class="sheet-body">
        <p class="sheet-info" id="cartInfo" hidden></p>
        <div id="cartLines"></div>
        <div class="fields" id="cartFields">
          <label class="field"><span>ชื่อ และ จำนวนคนบนโต๊ะ <b class="req" aria-hidden="true">*</b></span>
            <input type="text" id="fCustomer" maxlength="40" autocomplete="off" required placeholder="เช่น คุณเอ 3 คน"></label>
          <label class="field"><span>หมายเหตุ <small>(ไม่บังคับ)</small></span>
            <input type="text" id="fNote" maxlength="120" autocomplete="off" placeholder="เช่น ไม่เผ็ด ไม่ใส่ผัก"></label>
        </div>
        <p class="form-error" id="cartError" role="alert" hidden></p>
      </div>
      <div class="sheet-bar">
        <div class="bar-total"><span>ยอดรวม</span><b id="cartTotal">฿0</b></div>
        <button class="order-bar" type="button" id="orderBtn" data-submit>สั่งอาหาร</button>
      </div>
    </div>`;
  els = {
    info: $('#cartInfo', dlg), lines: $('#cartLines', dlg), fields: $('#cartFields', dlg), error: $('#cartError', dlg),
    total: $('#cartTotal', dlg), btn: $('#orderBtn', dlg), customer: $('#fCustomer', dlg), note: $('#fNote', dlg),
  };
  els.customer.value = form.customer;
  els.note.value = form.note;
}

function lineHTML(l) {
  const opt = optionText(l);
  return `<li class="line">
    <div class="l-main"><b>${esc(l.name)}</b>${opt ? `<small>${esc(opt)}</small>` : ''}<span class="l-unit">${baht(l.unit)} / จาน</span></div>
    <div class="l-side">
      <span class="l-price">${baht(lineTotal(l))}</span>
      <div class="qty sm">
        <button type="button" data-line-qty="-1" data-key="${esc(l.key)}" aria-label="ลดจำนวน ${esc(l.name)}">${ICONS.minus}</button>
        <span>${l.qty}</span>
        <button type="button" data-line-qty="1" data-key="${esc(l.key)}" aria-label="เพิ่มจำนวน ${esc(l.name)}" ${l.qty >= CONFIG.MAX_QTY ? 'disabled' : ''}>${ICONS.plus}</button>
      </div>
    </div>
    <button class="l-del" type="button" data-del data-key="${esc(l.key)}" aria-label="เอา ${esc(l.name)} ออก">${ICONS.trash}</button>
  </li>`;
}

function renderLines() {
  if (!els) return;
  const lines = getLines();
  els.lines.innerHTML = lines.length
    ? `<ul class="lines">${lines.map(lineHTML).join('')}</ul>`
    : `<div class="cart-empty"><span>${ICONS.bag}</span><strong>ยังไม่มีอาหารในออเดอร์</strong><button type="button" class="ghost-btn" data-close>เลือกเมนู</button></div>`;
  els.fields.hidden = !lines.length;
  els.total.textContent = baht(cartTotal(lines));
  els.btn.disabled = !lines.length || sending;
}

function setSending(v) {
  sending = v;
  els.btn.disabled = v || !getLines().length;
  els.btn.classList.toggle('busy', v);
  els.btn.textContent = v ? 'กำลังส่งออเดอร์…' : 'สั่งอาหาร';
  dlg.querySelectorAll('input, [data-line-qty], [data-del]').forEach(el => { el.disabled = v; });
}

function showError(msg) { els.error.textContent = msg; els.error.hidden = !msg; }

async function submit() {
  if (sending) return;
  const lines = getLines();
  if (!lines.length) return;
  if (!canOrder()) return showError('เมนูยังโหลดไม่สำเร็จ กรุณารอสักครู่หรือรีเฟรชหน้านี้ แล้วลองใหม่');
  if (!form.customer.trim()) {
    els.customer.classList.add('invalid');
    els.customer.focus();
    return showError('กรุณาใส่ชื่อและจำนวนคนบนโต๊ะ เช่น คุณเอ 3 คน');
  }
  const sentTotal = cartTotal(lines);
  showError('');
  setSending(true);
  try {
    clientId ??= uuid();
    const order = await submitOrder({
      clientId, fullLines: lines.map(l => ({ ...l })),
      customer: form.customer.trim(), note: form.note.trim(),
    });
    clearCart();
    form.customer = ''; form.note = '';
    clientId = null;
    setSending(false);
    closeCart();
    hooks.onSubmitted(order, sentTotal);
  } catch (err) {
    setSending(false);
    showError(err.message || 'ส่งออเดอร์ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
}

export function openCart() {
  skeleton();
  const removed = isTrustedSource() ? syncWithMenu(state.items, state.addons) : [];
  if (removed.length) {
    els.info.hidden = false;
    els.info.textContent = `เมนูมีการเปลี่ยนแปลง จึงนำออกจากออเดอร์: ${removed.join(', ')}`;
  }
  renderLines();
  if (!dlg.open) {
    document.documentElement.classList.add('lock');
    dlg.showModal();
  }
}

export function closeCart() {
  if (!dlg.open || dlg.classList.contains('closing')) return;
  const done = () => { dlg.classList.remove('closing'); dlg.close(); };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
  dlg.classList.add('closing');
  setTimeout(done, 230);
}

export function initCartSheet({ onSubmitted }) {
  hooks = { onSubmitted };
  dlg = $('#cartSheet');

  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) return closeCart();
    const q = e.target.closest('[data-line-qty]');
    if (q) {
      const l = getLines().find(x => x.key === q.dataset.key);
      if (l) setQty(l.key, l.qty + Number(q.dataset.lineQty));
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) return removeLine(del.dataset.key);
    if (e.target.closest('[data-submit]')) submit();
  });
  dlg.addEventListener('input', e => {
    if (e.target.id === 'fCustomer') { form.customer = e.target.value; e.target.classList.remove('invalid'); }
    if (e.target.id === 'fNote') form.note = e.target.value;
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); if (!sending) closeCart(); });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('lock'));

  /* ตะกร้าเปลี่ยน → วาดรายการใหม่ และเริ่มรหัสกันส่งซ้ำใหม่ (เพราะเนื้อหาออเดอร์เปลี่ยนแล้ว) */
  subscribe(() => { if (!sending) clientId = null; if (dlg.open) renderLines(); });
}
