/* js/customer/cart-button.js — ปุ่มออเดอร์กลม ลอยมุมซ้ายล่าง (โผล่ขึ้นมาเมื่อมีอาหารในออเดอร์) */
import { reduced } from '../shared/utils.js';
import { ICONS } from '../shared/icons.js';
import { cartCount } from '../shared/pricing.js';
import { getLines, subscribe } from './cart-store.js';

export function initCartButton({ onOpen }) {
  const fab = document.createElement('button');
  fab.className = 'cart-fab';
  fab.id = 'cartFab';
  fab.type = 'button';
  fab.hidden = true;
  fab.innerHTML = `${ICONS.bag}<span class="fab-count" aria-hidden="true">0</span>`;
  document.body.appendChild(fab);
  fab.addEventListener('click', onOpen);

  const count = fab.querySelector('.fab-count');
  let prev = 0;

  function update(lines) {
    const n = cartCount(lines);
    fab.setAttribute('aria-label', `ดูออเดอร์ ${n} รายการ`);
    count.textContent = n;
    if (n > 0 && fab.hidden) {
      fab.hidden = false;
      if (!reduced) { fab.classList.remove('enter'); void fab.offsetWidth; fab.classList.add('enter'); }
    } else if (n === 0) {
      fab.hidden = true;
    }
    if (n > prev && !fab.classList.contains('enter') && !reduced) {
      fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
    }
    if (n > 0 && fab.classList.contains('enter')) setTimeout(() => fab.classList.remove('enter'), 600);
    prev = n;
  }

  subscribe(update);
  update(getLines());
}
