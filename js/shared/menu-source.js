/* js/shared/menu-source.js — โหลดเมนู + Add-on จาก Google Sheet แล้วแปลงเป็นข้อมูลที่เว็บใช้

   แท็บ Menu   : id | name | category | description | price | special_extra | image | available | featured | addons
   แท็บ Addons : name | price | available | for
   (คอลัมน์ special_extra, addons และแท็บ Addons เป็นของใหม่ — ไม่ใส่ก็ใช้งานได้ตามปกติ)  */
import { CONFIG, isDemo } from './config.js';
import { parseCSV, rowsToObjects } from './csv.js';
import { matchCategory, ADDON_CATEGORIES } from './categories.js';
import { storage } from './utils.js';
import { DEMO_MENU_ROWS, DEMO_ADDON_ROWS } from './demo-data.js';

const TRUE_WORDS = ['true', 'yes', '1', 'y', 'ใช่', 'มี', 'ขาย', 'แนะนำ', '✓', 'x'];
const isTrue = v => TRUE_WORDS.includes(String(v ?? '').trim().toLowerCase());

export function parsePrice(v) {
  const m = String(v ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function resolveImage(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{10,})/i);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1200`;
  if (/^https?:\/\//i.test(u) || /^data:image\//i.test(u)) return u;
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(u)) return u;
  return '';
}

/* ---------- แปลงแถวจากชีต ---------- */
export function normalizeMenu(objs) {
  const items = [];
  objs.forEach(o => {
    const name = String(o.name || '').trim();
    if (!name) return;
    const availRaw = String(o.available ?? '').trim();
    const addonsRaw = String(o.addons ?? '').trim();
    const extra = parsePrice(o.special_extra) || 0;
    items.push({
      uid: items.length,
      id: String(o.id || '').trim(),
      name,
      cat: matchCategory(o.category) || matchCategory(name) || 'snack',
      desc: String(o.description || '').trim(),
      price: parsePrice(o.price),
      priceRaw: String(o.price || '').trim(),
      specialExtra: extra,
      hasSpecial: extra > 0,
      addonsMode: addonsRaw === '' ? 'auto' : (isTrue(addonsRaw) ? 'on' : 'off'),
      image: resolveImage(o.image),
      available: availRaw === '' ? true : isTrue(availRaw),
      featured: isTrue(o.featured),
    });
  });
  return items;
}

export function normalizeAddons(objs) {
  return objs.map(o => ({
    name: String(o.name || '').trim(),
    price: parsePrice(o.price),
    available: String(o.available ?? '').trim() === '' ? true : isTrue(o.available),
    forCat: matchCategory(o.for),
  })).filter(a => a.name && a.price != null);
}

/** Add-on ที่เมนูนี้เลือกเพิ่มได้ (ค่าเริ่มต้น: เฉพาะหมวดข้าวและบะหมี่) */
export function addonsFor(item, addons) {
  if (item.addonsMode === 'off') return [];
  if (item.addonsMode === 'auto' && !ADDON_CATEGORIES.includes(item.cat)) return [];
  return addons.filter(a => a.available && (!a.forCat || a.forCat === item.cat));
}

/* ---------- ดึงข้อมูลจาก Google Sheet ---------- */
async function fetchOnce(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ (HTTP ' + res.status + ')');
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error('ลิงก์นี้ไม่ได้ส่งข้อมูล CSV ตรวจการตั้งค่า Publish to web');
  return rowsToObjects(parseCSV(text));
}

/* ถ้าเบราว์เซอร์เชื่อมต่อไม่ได้ (TypeError: Failed to fetch) ลองใหม่อีกครั้งด้วยคำขอแบบเรียบง่ายที่สุด */
async function fetchCSV(url) {
  if (!url.startsWith('https://docs.google.com/')) throw new Error('ลิงก์ชีตไม่ถูกต้อง');
  try {
    return await fetchOnce(url + (url.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now(), { cache: 'no-store' });
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;
    await new Promise(r => setTimeout(r, 1200));
    try { return await fetchOnce(url); }
    catch (err2) {
      if (!(err2 instanceof TypeError)) throw err2;
      throw new Error('เบราว์เซอร์เชื่อมต่อ Google Sheets ไม่ได้ (เน็ตหลุด / ตัวบล็อกโฆษณา / ลิงก์ยังไม่ได้เผยแพร่)');
    }
  }
}

/** คืน { menuRows, addonRows }  — addonRows เป็น null ถ้าโหลดไม่สำเร็จ (ให้ใช้ค่าเดิมต่อ) */
export async function loadSheetData() {
  if (isDemo) return { menuRows: DEMO_MENU_ROWS, addonRows: DEMO_ADDON_ROWS };
  const menuRows = await fetchCSV(CONFIG.MENU_CSV_URL);
  let addonRows = [];
  if (CONFIG.ADDONS_CSV_URL) {
    try { addonRows = await fetchCSV(CONFIG.ADDONS_CSV_URL); }
    catch (err) { console.warn('[menu] โหลดแท็บ Addons ไม่สำเร็จ:', err); addonRows = null; }
  }
  return { menuRows, addonRows };
}

export const readMenuCache = () => {
  const c = storage.get(CONFIG.MENU_CACHE_KEY);
  return c && Array.isArray(c.menuRows) ? c : null;
};
export const writeMenuCache = (menuRows, addonRows) =>
  storage.set(CONFIG.MENU_CACHE_KEY, { t: Date.now(), menuRows, addonRows });
