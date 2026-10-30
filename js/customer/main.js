/* js/customer/main.js — จุดเริ่มต้นของหน้าลูกค้า (index.html): ต่อทุกส่วนเข้าด้วยกัน */
import { CONFIG, isDemo } from '../shared/config.js';
import { CAT } from '../shared/categories.js';
import { state, pickFirstFilled, loadFromCache, refreshMenu, isTrustedSource } from './menu-store.js';
import { initMenuPage, renderAll, showNotice, showSkeleton } from './menu-page.js';
import { initItemDetail, openDetail } from './item-detail.js';
import { initCartButton } from './cart-button.js';
import { initCartSheet, openCart } from './cart-sheet.js';
import { initOrderDone, showDone } from './order-done.js';
import { syncWithMenu } from './cart-store.js';

async function refresh({ quiet = false } = {}) {
  const { changed, message } = await refreshMenu();
  if (!state.userPicked) pickFirstFilled(location.hash.slice(1));
  if (isTrustedSource()) syncWithMenu(state.items, state.addons);
  if (!isDemo) showNotice(message, !!message);
  if (changed || !quiet) renderAll(true);
}

function init() {
  initMenuPage({ onOpen: openDetail, onRetry: () => refresh() });
  initItemDetail();
  initCartButton({ onOpen: openCart });
  initCartSheet({ onSubmitted: showDone });
  initOrderDone();

  const hashKey = location.hash.slice(1);
  if (CAT[hashKey]) state.cat = hashKey;

  const cached = loadFromCache();
  if (cached) {
    pickFirstFilled(hashKey);
    renderAll();
  } else {
    showSkeleton();
  }

  if (isDemo) showNotice('โหมดตัวอย่าง: รายการ ราคา และออเดอร์ในหน้านี้เป็นข้อมูลสมมติ เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น');
  refresh({ quiet: cached });
  if (!isDemo) setInterval(() => refresh({ quiet: true }), CONFIG.AUTO_REFRESH_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isDemo && Date.now() - state.lastFetch > 60 * 1000) {
      refresh({ quiet: true });
    }
  });
}

init();
