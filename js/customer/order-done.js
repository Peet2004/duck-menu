/* js/customer/order-done.js — หน้าเสร็จสิ้น: แสดงเลขออเดอร์ แล้วกลับไปหน้าเมนู */
import { $, baht, esc } from '../shared/utils.js';
import { ICONS } from '../shared/icons.js';
import { burst } from './effects.js';

let view;

export function initOrderDone() {
  view = $('#doneView');
  view.addEventListener('click', e => { if (e.target.closest('[data-back]')) hideDone(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !view.hidden) hideDone(); });
}

export function showDone(order, sentTotal) {
  const changed = order.total !== sentTotal;
  view.innerHTML = `
    <div class="done-card">
      <div class="done-check">${ICONS.check}</div>
      <h2 id="doneTitle">สั่งอาหารเรียบร้อยแล้ว</h2>
      <p class="done-sub">แม่ค้าได้รับออเดอร์ของคุณแล้ว</p>
      <div class="done-no"><small>เลขออเดอร์ของคุณ</small><b>#${esc(order.orderNo)}</b></div>
      <p class="done-total">ยอดรวม <b>${baht(order.total)}</b></p>
      ${changed ? '<p class="done-warn">ราคาถูกปรับตามเมนูล่าสุดของร้าน</p>' : ''}
      <p class="done-hint">กรุณาจำเลขออเดอร์ไว้ แล้วแจ้งแม่ค้าเมื่อรับอาหาร</p>
      <button class="done-btn" type="button" data-back>กลับไปหน้าเมนู</button>
    </div>`;
  view.hidden = false;
  document.documentElement.classList.add('lock');
  $('[data-back]', view).focus({ preventScroll: true });
  burst(window.innerWidth / 2, window.innerHeight * 0.3, 28);
}

function hideDone() {
  view.hidden = true;
  view.innerHTML = '';
  document.documentElement.classList.remove('lock');
  window.scrollTo({ top: 0 });
}
