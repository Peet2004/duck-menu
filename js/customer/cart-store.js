/* js/customer/cart-store.js — ออเดอร์ที่ลูกค้าเลือกไว้ (ตะกร้า) เก็บในเครื่อง รีเฟรชหน้าแล้วไม่หาย */
import { CONFIG } from '../shared/config.js';
import { storage } from '../shared/utils.js';
import { lineKey, unitPrice } from '../shared/pricing.js';
import { addonsFor } from '../shared/menu-source.js';

/* รูปแบบรายการ: { key, itemId, name, cat, size: 'normal'|'special', addons: [{name, price}], qty, unit } */
const saved = storage.get(CONFIG.CART_KEY, []);
let lines = Array.isArray(saved) ? saved.filter(l => l && l.key && l.qty > 0) : [];
const subs = new Set();

function commit() {
  storage.set(CONFIG.CART_KEY, lines);
  subs.forEach(fn => fn(lines));
}

export const getLines = () => lines;
export const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };

export function addLine({ item, size, addons, qty }) {
  const itemId = item.id || item.name;
  const key = lineKey(itemId, size, addons);
  const unit = unitPrice(item, size, addons);
  const found = lines.find(l => l.key === key);
  if (found) {
    found.qty = Math.min(CONFIG.MAX_QTY, found.qty + qty);
    found.unit = unit;
  } else {
    lines.push({
      key, itemId, name: item.name, cat: item.cat, size,
      addons: addons.map(a => ({ name: a.name, price: a.price })), qty: Math.min(CONFIG.MAX_QTY, qty), unit,
    });
  }
  commit();
}

export function setQty(key, qty) {
  const l = lines.find(x => x.key === key);
  if (!l) return;
  if (qty <= 0) return removeLine(key);
  l.qty = Math.min(CONFIG.MAX_QTY, qty);
  commit();
}

export function removeLine(key) {
  lines = lines.filter(l => l.key !== key);
  commit();
}

export function clearCart() {
  lines = [];
  commit();
}

/** ตรวจรายการในตะกร้ากับเมนูล่าสุด: อัปเดตราคา และเอาเมนูที่หมด/หายไปออก → คืนชื่อรายการที่ถูกเอาออก */
export function syncWithMenu(items, addons) {
  const removed = [];
  let changed = false;
  lines = lines.filter(l => {
    const item = items.find(i => (i.id || i.name) === l.itemId);
    if (!item || !item.available || item.price == null || (l.size === 'special' && !item.hasSpecial)) {
      removed.push(l.name); changed = true; return false;
    }
    const offered = addonsFor(item, addons);
    const fresh = l.addons.map(a => offered.find(o => o.name === a.name));
    if (fresh.some(a => !a)) { removed.push(l.name); changed = true; return false; }
    const unit = unitPrice(item, l.size, fresh);
    if (unit !== l.unit || fresh.some((a, i) => a.price !== l.addons[i].price)) {
      l.unit = unit; l.addons = fresh.map(a => ({ name: a.name, price: a.price })); changed = true;
    }
    return true;
  });
  if (changed) commit();
  return removed;
}
