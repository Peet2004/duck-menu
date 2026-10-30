/* js/seller/orders-view.js — รายการออเดอร์ของแม่ค้า: เลขออเดอร์ รายการอาหาร ยอดรวม และปุ่มเปลี่ยนสถานะ */
import { esc, baht, fmtNum } from '../shared/utils.js';

export const STATUS_LABEL = { new: 'รอทำ', done: 'เสร็จแล้ว', cancelled: 'ยกเลิก' };

export const FILTERS = [
  { key: 'all',  label: 'ทั้งหมด', test: () => true },
  { key: 'new',  label: 'รอทำ',    test: o => o.status === 'new' },
  { key: 'done', label: 'เสร็จแล้ว', test: o => o.status === 'done' },
];

function itemHTML(it) {
  const opts = [];
  if (it.addons && it.addons.length) opts.push('+ ' + it.addons.map(a => a.name).join(', '));
  return `<li>
    <span class="oi-name">${esc(it.name)}${it.size === 'special' ? '<em>(พิเศษ)</em>' : ''}<span class="oi-qty">×${fmtNum(it.qty)}</span></span>
    <span class="oi-price">${baht(it.lineTotal)}</span>
    ${opts.length ? `<span class="oi-opt">${esc(opts.join(' '))}</span>` : ''}
  </li>`;
}

function actionsHTML(o) {
  const id = esc(o.orderId);
  if (o.status === 'new') {
    return `<button class="act quiet" type="button" data-status="cancelled" data-id="${id}">ยกเลิก</button>
            <button class="act go" type="button" data-status="done" data-id="${id}">ทำเสร็จแล้ว</button>`;
  }
  return `<button class="act" type="button" data-status="new" data-id="${id}">กลับเป็นรอทำ</button>`;
}

function orderHTML(o, isNew) {
  return `<li class="order ${o.status}${isNew ? ' is-new' : ''}" data-order="${esc(o.orderId)}">
    <div class="o-head">
      <div>
        <div class="o-no">#${esc(o.orderNo)}</div>
        <div class="o-meta">${esc(o.time)} น.${o.customer ? ` · <b>${esc(o.customer)}</b>` : ''}</div>
      </div>
      <span class="pill">${STATUS_LABEL[o.status] || esc(o.status)}</span>
    </div>
    <ul class="o-items">${o.items.map(itemHTML).join('')}</ul>
    ${o.note ? `<div class="o-note">หมายเหตุ: ${esc(o.note)}</div>` : ''}
    <div class="o-foot">
      <div class="o-total"><small>ยอดรวมออเดอร์</small><b>${baht(o.total)}</b></div>
      <div class="o-actions">${actionsHTML(o)}</div>
    </div>
  </li>`;
}

/** วาดรายการ — ใหม่สุดอยู่บน  newIds = ออเดอร์ที่เพิ่งเข้ามา (ให้กะพริบเน้น) */
export function renderOrders(el, orders, filterKey, newIds = new Set()) {
  const f = FILTERS.find(x => x.key === filterKey) || FILTERS[0];
  const list = orders.filter(f.test).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (!list.length) {
    el.innerHTML = `<div class="empty-orders"><strong>${orders.length ? 'ไม่มีออเดอร์ในกลุ่มนี้' : 'ยังไม่มีออเดอร์'}</strong>ออเดอร์ใหม่จะขึ้นที่นี่อัตโนมัติ</div>`;
    return;
  }
  el.innerHTML = `<ul class="orders">${list.map(o => orderHTML(o, newIds.has(o.orderId))).join('')}</ul>`;
}

export function renderTabs(el, orders, filterKey) {
  el.innerHTML = FILTERS.map(f =>
    `<button class="tab" type="button" role="tab" data-filter="${f.key}" aria-selected="${f.key === filterKey}">${f.label} (${orders.filter(f.test).length})</button>`).join('');
}
