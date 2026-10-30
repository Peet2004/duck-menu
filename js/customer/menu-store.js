/* js/customer/menu-store.js — ข้อมูลเมนูและสถานะหน้าเมนู (ไม่มีโค้ดแสดงผลในไฟล์นี้) */
import { isDemo } from '../shared/config.js';
import { CATEGORIES } from '../shared/categories.js';
import { FALLBACK_MENU_ROWS } from '../shared/demo-data.js';
import {
  loadSheetData, normalizeMenu, normalizeAddons, readMenuCache, writeMenuCache,
} from '../shared/menu-source.js';

export const state = {
  items: [],
  addons: [],
  addonRows: [],
  cat: CATEGORIES[0].key,
  featuredOnly: false,
  source: 'none',      // none | sheet | cache | fallback | demo
  lastFetch: 0,
  rolling: false,
  userPicked: false,
};

export const itemsOf = key => state.items.filter(i => i.cat === key);
export const visibleList = () => itemsOf(state.cat).filter(i => !state.featuredOnly || i.featured);
export const findItem = uid => state.items.find(i => i.uid === uid);
/** เมนูที่ดึงจากชีตจริง/โหมดตัวอย่างเท่านั้น (ไม่นับเมนูสำรอง) ถึงจะเชื่อถือราคาได้ */
export const isTrustedSource = () => state.source === 'sheet' || state.source === 'demo';
/** สั่งอาหารได้ถ้ามีเมนูจริง (รวมเมนูที่เก็บไว้ในเครื่อง) — ราคาจริงเซิร์ฟเวอร์คำนวณจากชีตใหม่อยู่แล้ว ไม่เชื่อราคาจากเครื่องลูกค้า */
export const canOrder = () => isTrustedSource() || state.source === 'cache';

function applyData(menuRows, addonRows, source) {
  const items = normalizeMenu(menuRows);
  const addons = addonRows == null ? state.addons : normalizeAddons(addonRows);
  const changed = JSON.stringify([items, addons]) !== JSON.stringify([state.items, state.addons]);
  state.items = items;
  state.addons = addons;
  if (addonRows != null) state.addonRows = addonRows;
  state.source = source;
  return changed;
}

/** ถ้าไม่ได้ระบุหมวดใน URL และหมวดแรกว่าง ให้ไปหมวดแรกที่มีเมนู */
export function pickFirstFilled(hashKey) {
  if (CATEGORIES.some(c => c.key === hashKey)) return;
  if (itemsOf(state.cat).length) return;
  const first = CATEGORIES.find(c => itemsOf(c.key).length);
  if (first) state.cat = first.key;
}

/** โหลดจากแคชในเครื่อง (เปิดหน้าเร็วทันที) — คืน true ถ้ามีแคช */
export function loadFromCache() {
  if (isDemo) return false;
  const c = readMenuCache();
  if (!c) return false;
  applyData(c.menuRows, c.addonRows, 'cache');
  return true;
}

/** ดึงข้อมูลล่าสุดจากชีต → { changed, message }  (message = ข้อความแจ้งเตือนถ้ามี) */
export async function refreshMenu() {
  try {
    const { menuRows, addonRows } = await loadSheetData();
    if (!normalizeMenu(menuRows).length) throw new Error('ชีตไม่มีรายการเมนู');
    const changed = applyData(menuRows, addonRows, isDemo ? 'demo' : 'sheet');
    if (!isDemo) writeMenuCache(menuRows, addonRows ?? state.addonRows);
    state.lastFetch = Date.now();
    return { changed, message: '' };
  } catch (err) {
    console.warn('[menu] โหลดชีตไม่สำเร็จ:', err);
    if (state.source === 'cache') {
      return { changed: false, message: 'กำลังแสดงเมนูที่บันทึกไว้ในเครื่อง ยังเชื่อมต่อชีตไม่ได้ (' + (err.message || 'ไม่ทราบสาเหตุ') + ')' };
    }
    if (state.source === 'none' || state.source === 'fallback') {
      applyData(FALLBACK_MENU_ROWS, [], 'fallback');
      return { changed: true, message: 'โหลดเมนูล่าสุดไม่สำเร็จ (' + (err.message || 'ไม่ทราบสาเหตุ') + ') ตอนนี้แสดงเฉพาะรายการสำรอง สั่งอาหารไม่ได้จนกว่าจะโหลดเมนูสำเร็จ' };
    }
    return { changed: false, message: '' };
  }
}
