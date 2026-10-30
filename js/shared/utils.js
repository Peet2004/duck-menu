/* js/shared/utils.js — ฟังก์ชันช่วยเล็ก ๆ ที่ใช้ร่วมกัน */

export const $ = (sel, root = document) => root.querySelector(sel);
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export const esc = s => String(s ?? '').replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const fmtNum = n => (n % 1 ? n.toFixed(2) : Math.round(n).toLocaleString('th-TH'));
export const baht = n => '฿' + fmtNum(n);

/** วันที่วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD */
export const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

export function thaiDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('th-TH',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

/** ข้อความสั้น ๆ ลอยขึ้นมาแล้วหายไปเอง */
export function toast(msg) {
  let box = document.getElementById('toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast';
    box.className = 'toast';
    box.setAttribute('role', 'status');
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.remove('show'), 2200);
}
