/* js/shared/orders-api.js — ส่ง/ดึงออเดอร์
   - ใช้งานจริง : คุยกับ Google Apps Script (CONFIG.ORDER_API_URL) ซึ่งบันทึกลงแท็บ Orders ใน Google Sheet
   - โหมด ?demo : จำลองเซิร์ฟเวอร์ในเบราว์เซอร์ (localStorage) เพื่อทดลองทั้งฝั่งลูกค้าและฝั่งแม่ค้า

   รูปแบบออเดอร์ที่ได้กลับมา:
   { orderId, orderNo, date, time, status: 'new'|'done'|'cancelled', customer, note, total, createdAt,
     items: [{ name, size: 'normal'|'special', addons: [{name, price}], qty, unit, lineTotal }] }            */
import { CONFIG, isDemo } from './config.js';
import { storage, todayStr } from './utils.js';

export class ApiError extends Error {
  constructor(message, code = 'ERROR') { super(message); this.code = code; }
}

/* ======================= Google Apps Script ======================= */
async function callRemote(body) {
  if (!CONFIG.ORDER_API_URL) throw new ApiError('ยังไม่ได้ตั้งค่าระบบรับออเดอร์ (ORDER_API_URL ใน js/shared/config.js)', 'NO_API');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  let res;
  try {
    /* text/plain = "simple request" ไม่ต้อง preflight ซึ่ง Apps Script ไม่รองรับ */
    res = await fetch(CONFIG.ORDER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    throw new ApiError(err.name === 'AbortError' ? 'เชื่อมต่อช้าเกินไป กรุณาลองอีกครั้ง' : 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาลองอีกครั้ง', 'NETWORK');
  } finally { clearTimeout(timer); }
  if (!res.ok) throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (HTTP ' + res.status + ')', 'HTTP');
  let data;
  try { data = await res.json(); } catch { throw new ApiError('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ ตรวจการ Deploy ของ Apps Script', 'BAD_RESPONSE'); }
  if (!data.ok) throw new ApiError(data.error || 'เกิดข้อผิดพลาด', data.code || 'ERROR');
  return data;
}

/* ======================= โหมดทดลอง (?demo) ======================= */
const demoOrders = () => storage.get(CONFIG.DEMO_ORDERS_KEY, []);
const saveDemoOrders = list => storage.set(CONFIG.DEMO_ORDERS_KEY, list);

function demoPin(pin) {
  if (String(pin) !== CONFIG.DEMO_PIN) throw new ApiError('รหัสไม่ถูกต้อง', 'BAD_PIN');
}

function demoSubmit({ clientId, fullLines, customer, note }) {
  const list = demoOrders();
  const dup = list.find(o => o.clientId === clientId);
  if (dup) return dup;
  const date = todayStr();
  const n = list.filter(o => o.date === date).reduce((mx, o) => Math.max(mx, Number(o.orderNo)), 0) + 1;
  const orderNo = String(n).padStart(3, '0');
  const items = fullLines.map(l => ({
    name: l.name, size: l.size, addons: l.addons, qty: l.qty, unit: l.unit, lineTotal: l.unit * l.qty,
  }));
  const now = new Date();
  const order = {
    orderId: date.replace(/-/g, '') + '-' + orderNo, orderNo, date,
    time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }),
    status: 'new', customer: customer || '', note: note || '',
    items, total: items.reduce((s, i) => s + i.lineTotal, 0),
    createdAt: now.toISOString(), clientId,
  };
  list.push(order);
  saveDemoOrders(list);
  return order;
}

/* ======================= ฟังก์ชันที่หน้าเว็บเรียกใช้ ======================= */

/** ลูกค้าส่งออเดอร์ — fullLines คือรายการในตะกร้า (จาก cart-store) */
export async function submitOrder({ clientId, fullLines, customer, note }) {
  if (isDemo) return demoSubmit({ clientId, fullLines, customer, note });
  const lines = fullLines.map(l => ({
    id: l.itemId, name: l.name, size: l.size, addons: l.addons.map(a => a.name), qty: l.qty,
  }));
  const data = await callRemote({ action: 'submit', clientId, lines, customer, note });
  return data.order;
}

/** แม่ค้าดูออเดอร์ของวันที่ระบุ (YYYY-MM-DD) — ใช้เช็กรหัสผ่านไปในตัว */
export async function listOrders(pin, date) {
  if (isDemo) {
    demoPin(pin);
    return demoOrders().filter(o => o.date === date);
  }
  const data = await callRemote({ action: 'list', pin, date });
  return data.orders;
}

/** แม่ค้าเปลี่ยนสถานะ: 'new' | 'done' | 'cancelled' */
export async function setOrderStatus(pin, orderId, status) {
  if (isDemo) {
    demoPin(pin);
    const list = demoOrders();
    const o = list.find(x => x.orderId === orderId);
    if (!o) throw new ApiError('ไม่พบออเดอร์นี้', 'NOT_FOUND');
    o.status = status; saveDemoOrders(list);
    return o;
  }
  const data = await callRemote({ action: 'status', pin, orderId, status });
  return data.order;
}
