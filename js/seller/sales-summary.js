/* js/seller/sales-summary.js — สรุปยอดขายของวันที่เลือก (ไม่นับออเดอร์ที่ยกเลิก) */
import { baht, thaiDate } from '../shared/utils.js';

export function summarize(orders) {
  const live = orders.filter(o => o.status !== 'cancelled');
  return {
    total: live.reduce((s, o) => s + (Number(o.total) || 0), 0),
    count: live.length,
    pending: orders.filter(o => o.status === 'new').length,
    done: orders.filter(o => o.status === 'done').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };
}

export function renderSummary(el, orders, date, isToday) {
  const s = summarize(orders);
  el.innerHTML = `
    <div class="stat main"><small>ยอดขาย${isToday ? 'วันนี้' : ''} (${thaiDate(date)})</small><b>${baht(s.total)}</b><span>ไม่รวมออเดอร์ที่ยกเลิก${s.cancelled ? ` (${s.cancelled} ออเดอร์)` : ''}</span></div>
    <div class="stat"><small>ออเดอร์ทั้งหมด</small><b>${s.count}</b></div>
    <div class="stat"><small>รอทำ</small><b>${s.pending}</b></div>
    <div class="stat"><small>เสร็จแล้ว</small><b>${s.done}</b></div>`;
  return s;
}
