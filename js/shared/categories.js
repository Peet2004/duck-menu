/* js/shared/categories.js — หมวดหมู่เมนู + การจับคู่ชื่อหมวดจาก Google Sheet */

/* เรียงตามที่แสดงในแถบด้านซ้าย  (matchLast = ตรวจเป็นลำดับสุดท้ายเมื่อเดาหมวดจากชื่อ) */
export const CATEGORIES = [
  { key: 'roast',  label: 'เป็ดย่าง',    sub: 'จาน ครึ่งตัว ทั้งตัว', matchLast: true,
    aliases: ['เป็ดย่าง', 'เป็ดครึ่งตัว', 'เป็ดทั้งตัว', 'เป็ด 1 ตัว', 'roast'] },
  { key: 'rice',   label: 'ข้าว',        sub: 'เมนูข้าว',
    aliases: ['ข้าว', 'เมนูเป็ด', 'rice'] },
  { key: 'noodle', label: 'บะหมี่',      sub: 'เมนูบะหมี่',
    aliases: ['บะหมี่', 'หมี่', 'เส้น', 'ก๋วยเตี๋ยว', 'noodle'] },
  { key: 'soup',   label: 'ซุป',         sub: 'เมนูซุป',
    aliases: ['ซุป', 'ต้มจืด', 'soup'] },
  { key: 'snack',  label: 'ของทานเล่น',  sub: 'ซาลาเปา ขนมจีบ',
    aliases: ['ของทานเล่น', 'ทานเล่น', 'เมนูเสริม', 'ซาลาเปา', 'ขนมจีบ', 'เกี๊ยว', 'ติ่มซำ', 'ติ่มซํา', 'หมั่นโถ', 'snack', 'dimsum', 'dim sum'] },
  { key: 'drink',  label: 'เครื่องดื่ม', sub: 'น้ำอัดลม เครื่องดื่ม',
    aliases: ['เครื่องดื่ม', 'น้ำอัดลม', 'น้ำหวาน', 'น้ำเปล่า', 'drink', 'beverage'] },
];

export const CAT = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

/** หมวดที่เพิ่ม Add-on ได้โดยอัตโนมัติ (ข้าว และ บะหมี่) */
export const ADDON_CATEGORIES = ['rice', 'noodle'];

const MATCH_ORDER = [...CATEGORIES.filter(c => !c.matchLast), ...CATEGORIES.filter(c => c.matchLast)];

export function matchCategory(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  const exact = CATEGORIES.find(c => c.label === t || c.key === t);
  if (exact) return exact.key;
  for (const c of MATCH_ORDER) if (c.aliases.some(a => t.includes(a))) return c.key;
  return null;
}
