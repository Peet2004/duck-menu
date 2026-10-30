/* js/customer/card-parts.js — ชิ้นส่วน HTML ที่ใช้ซ้ำในการ์ดเมนูและ popup (รูป / ราคา) */
import { esc, fmtNum } from '../shared/utils.js';
import { artSVG } from '../shared/artwork.js';

export function mediaHTML(item) {
  if (item.image) {
    return `<img src="${esc(item.image)}" alt="${esc(item.name)}" data-cat="${item.cat}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  }
  return `<span class="art">${artSVG(item.cat)}</span>`;
}

/** ราคาตัวใหญ่ (ใส่ราคาที่ต้องการแสดงเอง หรือใช้ราคาธรรมดาของเมนู) */
export function priceHTML(item, value = item.price) {
  if (value != null) {
    return `<span class="price"><span class="cur">฿</span><span class="num" data-price="${value}" data-num>${fmtNum(value)}</span><span class="unit">บาท</span></span>`;
  }
  const txt = item.priceRaw || 'สอบถามราคา';
  return `<span class="price text"><span class="num">${esc(txt)}</span></span>`;
}

/** ราคาบนการ์ด: มีแบบพิเศษ → แสดงทั้งธรรมดาและพิเศษ */
export function cardPriceHTML(item) {
  if (item.price == null || !item.hasSpecial) return priceHTML(item);
  return `<span class="price-pair">
    <span class="plabel">ธรรมดา</span>${priceHTML(item)}
    <span class="special-line"><b>พิเศษ</b> ฿${fmtNum(item.price + item.specialExtra)}</span>
  </span>`;
}
