/* js/seller/main.js — จุดเริ่มต้นของหน้าแม่ค้า (seller.html): เข้าสู่ระบบ → ดึงออเดอร์ทุก 10 วินาที → แสดงผล */
import { $, todayStr, toast } from '../shared/utils.js';
import { CONFIG, isDemo } from '../shared/config.js';
import { ICONS } from '../shared/icons.js';
import { listOrders, setOrderStatus } from '../shared/orders-api.js';
import { getPin, savePin, clearPin, initLogin, showLogin } from './seller-auth.js';
import { renderSummary } from './sales-summary.js';
import { renderOrders, renderTabs } from './orders-view.js';
import { enableSound, disableSound, soundReady, beep } from './alert-sound.js';

const S = {
  pin: '', date: todayStr(), followToday: true,
  orders: [], filter: 'all', known: null, fresh: new Set(), timer: 0, busy: false,
};

const els = {};
const isToday = () => S.date === todayStr();

function showNotice(msg) {
  els.notice.hidden = !msg;
  els.notice.textContent = msg || '';
}

function renderAll() {
  renderSummary(els.summary, S.orders, S.date, isToday());
  renderTabs(els.tabs, S.orders, S.filter);
  renderOrders(els.orders, S.orders, S.filter, S.fresh);
  els.todayBtn.hidden = isToday();
  const pending = S.orders.filter(o => o.status === 'new').length;
  document.title = (pending ? `(${pending}) ` : '') + 'หน้าแม่ค้า — เป็ดย่างบางกะปิ';
}

function renderSoundBtn() {
  const on = soundReady();
  els.soundBtn.setAttribute('aria-pressed', String(on));
  els.soundBtn.innerHTML = `${ICONS.bell}${on ? 'เสียงเตือน: เปิด' : 'เปิดเสียงเตือน'}`;
}

/** ดึงออเดอร์ล่าสุด — คืน true ถ้าสำเร็จ */
async function load({ manual = false } = {}) {
  if (S.busy) return false;
  S.busy = true;
  if (manual) els.refreshBtn.classList.add('spin');
  try {
    if (S.followToday && S.date !== todayStr()) { S.date = todayStr(); S.known = null; els.dateInput.value = S.date; }
    const orders = await listOrders(S.pin, S.date);
    const ids = new Set(orders.map(o => o.orderId));
    S.fresh = new Set();
    if (S.known) {
      orders.forEach(o => { if (!S.known.has(o.orderId) && o.status === 'new') S.fresh.add(o.orderId); });
      if (S.fresh.size && isToday()) { beep(); }
    }
    S.known = ids;
    S.orders = orders;
    showNotice('');
    els.updated.textContent = 'อัปเดตล่าสุด ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Bangkok' });
    renderAll();
    return true;
  } catch (err) {
    if (err.code === 'BAD_PIN') { logout('รหัสไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่'); return false; }
    showNotice((err.message || 'เชื่อมต่อไม่ได้') + ' — ข้อมูลที่เห็นอาจไม่ใช่ล่าสุด');
    return false;
  } finally {
    S.busy = false;
    els.refreshBtn.classList.remove('spin');
  }
}

function startPolling() {
  clearInterval(S.timer);
  S.timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, CONFIG.SELLER_POLL_MS);
}

async function login(pin) {
  const orders = await listOrders(pin, S.date);       // โยน error ถ้ารหัสผิด / เชื่อมต่อไม่ได้
  S.pin = pin; savePin(pin);
  S.orders = orders; S.known = new Set(orders.map(o => o.orderId)); S.fresh = new Set();
  showLogin(false);
  showNotice('');
  els.dateInput.value = S.date;
  renderAll();
  startPolling();
}

function logout(message = '') {
  clearInterval(S.timer);
  clearPin(); S.pin = ''; S.orders = []; S.known = null;
  disableSound(); renderSoundBtn();
  document.title = 'หน้าแม่ค้า — เป็ดย่างบางกะปิ';
  showLogin(true);
  if (message) { $('#loginError').textContent = message; $('#loginError').hidden = false; }
}

async function changeStatus(orderId, status) {
  const o = S.orders.find(x => x.orderId === orderId);
  if (!o || o.status === status) return;
  if (status === 'cancelled' && !confirm(`ยกเลิกออเดอร์ #${o.orderNo} ใช่ไหม?`)) return;
  const prev = o.status;
  o.status = status; renderAll();                      // เปลี่ยนบนหน้าจอทันที แล้วค่อยบันทึก
  try { await setOrderStatus(S.pin, orderId, status); }
  catch (err) { o.status = prev; renderAll(); toast('บันทึกสถานะไม่สำเร็จ: ' + (err.message || 'ลองอีกครั้ง')); }
}

function init() {
  Object.assign(els, {
    notice: $('#notice'), summary: $('#summary'), tabs: $('#tabs'), orders: $('#orders'), updated: $('#updated'),
    dateInput: $('#dateInput'), todayBtn: $('#todayBtn'), soundBtn: $('#soundBtn'), refreshBtn: $('#refreshBtn'),
  });
  els.refreshBtn.innerHTML = ICONS.refresh;
  renderSoundBtn();

  initLogin({ onLogin: login });

  els.dateInput.addEventListener('change', () => {
    if (!els.dateInput.value) return;
    S.date = els.dateInput.value; S.followToday = isToday(); S.known = null;
    load({ manual: true });
  });
  els.todayBtn.addEventListener('click', () => {
    S.date = todayStr(); S.followToday = true; S.known = null; els.dateInput.value = S.date;
    load({ manual: true });
  });
  els.refreshBtn.addEventListener('click', () => load({ manual: true }));
  els.soundBtn.addEventListener('click', () => {
    if (soundReady()) disableSound(); else if (!enableSound()) toast('เบราว์เซอร์นี้ไม่รองรับเสียงเตือน');
    renderSoundBtn();
  });
  $('#logoutBtn').addEventListener('click', () => logout());

  els.tabs.addEventListener('click', e => {
    const t = e.target.closest('[data-filter]');
    if (t) { S.filter = t.dataset.filter; renderAll(); }
  });
  els.orders.addEventListener('click', e => {
    const b = e.target.closest('[data-status]');
    if (b) changeStatus(b.dataset.id, b.dataset.status);
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.pin) load(); });

  /* ถ้าเคยเข้าสู่ระบบในแท็บนี้แล้ว (รีเฟรชหน้า) ให้เข้าต่อได้เลย */
  const saved = getPin();
  if (saved) login(saved).catch(() => logout());
  else showLogin(true);
}

init();
