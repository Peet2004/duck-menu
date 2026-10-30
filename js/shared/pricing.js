/* js/shared/pricing.js — คิดราคา (ใช้ร่วมกันทั้งหน้าเมนู ตะกร้า และตัวอย่างออเดอร์) */

export const SIZE_LABEL = { normal: 'ธรรมดา', special: 'พิเศษ' };

/** ราคาต่อ 1 จาน = ราคาธรรมดา (+ ราคาพิเศษที่บวกเพิ่ม) + add-on ที่เลือก */
export function unitPrice(item, size, addons) {
  let p = item.price || 0;
  if (size === 'special' && item.hasSpecial) p += item.specialExtra;
  return p + addons.reduce((s, a) => s + a.price, 0);
}

export const lineKey = (itemId, size, addons) =>
  [itemId, size, addons.map(a => a.name).sort().join('+')].join('|');

export const lineTotal = l => l.unit * l.qty;
export const cartTotal = lines => lines.reduce((s, l) => s + lineTotal(l), 0);
export const cartCount = lines => lines.reduce((s, l) => s + l.qty, 0);

/** ข้อความอธิบายตัวเลือกของรายการ เช่น "พิเศษ · ไข่ดาว, เป็ดเพิ่ม" */
export function optionText(line) {
  const parts = [];
  if (line.size === 'special') parts.push(SIZE_LABEL.special);
  if (line.addons && line.addons.length) parts.push(line.addons.map(a => a.name).join(', '));
  return parts.join(' · ');
}
