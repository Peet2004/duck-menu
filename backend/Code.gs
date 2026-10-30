/* =========================================================
   backend/Code.gs — ระบบหลังบ้านรับออเดอร์ (Google Apps Script)

   ทำงานร่วมกับ Google Sheet เดียวกับเมนู  (เปิดจาก Sheet > ส่วนขยาย > Apps Script)
   - รับออเดอร์จากลูกค้า  → บันทึกลงแท็บ "Orders"
   - ให้แม่ค้าดูออเดอร์/เปลี่ยนสถานะ (ต้องใส่รหัส SELLER_PIN)
   - ราคาคำนวณใหม่จากแท็บ "Menu" และ "Addons" ที่ฝั่งนี้เสมอ
     (ลูกค้าแก้ราคาจากฝั่งเบราว์เซอร์ไม่ได้)

   วิธีติดตั้งดูใน README-TH.md
   ========================================================= */

const SHEET_MENU = 'Menu';
const SHEET_ADDONS = 'Addons';
const SHEET_ORDERS = 'Orders';

const ORDER_HEADERS = [
  'orderId', 'orderNo', 'date', 'time', 'status', 'customer', 'note',
  'items', 'itemsText', 'total', 'clientId', 'createdAt',
];
const COL = {};                      // ชื่อคอลัมน์ → ลำดับ (เริ่มที่ 0)
ORDER_HEADERS.forEach(function (h, i) { COL[h] = i; });

const STATUSES = ['new', 'done', 'cancelled'];
const MAX_LINES = 40;
const MAX_QTY = 20;
const MAX_ORDERS_PER_MINUTE = 30;    // กันถูกยิงออเดอร์รัว ๆ
const PIN_MAX_FAILS = 5;             // ใส่รหัสผิดเกินนี้ → รอ 1 นาที
const TRUE_WORDS = ['true', 'yes', '1', 'y', 'ใช่', 'มี', 'ขาย', 'แนะนำ', '✓', 'x'];

/* ---------------------------------------------------------
   จุดรับคำขอจากเว็บ
   --------------------------------------------------------- */
function doGet() {
  return out_({ ok: true, service: 'duck-menu-orders' });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.action) {
      case 'submit': return out_(submitOrder_(body));
      case 'list':   requirePin_(body.pin); return out_(listOrders_(body.date));
      case 'status': requirePin_(body.pin); return out_(updateStatus_(body.orderId, body.status));
      default: throw userError_('คำสั่งไม่ถูกต้อง', 'BAD_ACTION');
    }
  } catch (err) {
    if (!err.userMessage) console.error(err && err.stack ? err.stack : err);
    return out_({ ok: false, error: err.userMessage || 'ระบบขัดข้อง กรุณาลองอีกครั้ง', code: err.code || 'ERROR' });
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function userError_(message, code) {
  var err = new Error(message);
  err.userMessage = message;
  err.code = code || 'ERROR';
  return err;
}

/* ---------------------------------------------------------
   แม่ค้า: ตรวจรหัส
   --------------------------------------------------------- */
function requirePin_(input) {
  var pin = PropertiesService.getScriptProperties().getProperty('SELLER_PIN');
  if (!pin) throw userError_('ยังไม่ได้ตั้งรหัส SELLER_PIN ใน Script properties ของ Apps Script', 'NO_PIN');
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('pin_fails') || 0);
  if (fails >= PIN_MAX_FAILS) throw userError_('ใส่รหัสผิดหลายครั้ง กรุณารอ 1 นาทีแล้วลองใหม่', 'LOCKED');
  if (String(input || '') !== String(pin)) {
    cache.put('pin_fails', String(fails + 1), 60);
    throw userError_('รหัสไม่ถูกต้อง', 'BAD_PIN');
  }
  if (fails) cache.remove('pin_fails');
}

/* ---------------------------------------------------------
   อ่านตารางจากแท็บ (แถวแรก = หัวคอลัมน์)
   --------------------------------------------------------- */
function readTable_(name, optional) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) {
    if (optional) return [];
    throw userError_('ไม่พบแท็บ "' + name + '" ใน Google Sheet', 'NO_SHEET');
  }
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var head = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  return values.slice(1).filter(function (r) {
    return r.some(function (c) { return String(c).trim() !== ''; });
  }).map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function num_(v) {
  var m = String(v == null ? '' : v).replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function isAvailable_(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === '' ? true : TRUE_WORDS.indexOf(s) !== -1;
}

/* ---------------------------------------------------------
   ชีต Orders
   --------------------------------------------------------- */
function ordersSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS);
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]).setFontWeight('bold');
    sheet.getRange(1, 1, sheet.getMaxRows(), ORDER_HEADERS.length).setNumberFormat('@');   // เก็บเป็นข้อความ (เลข 001 ไม่กลายเป็น 1)
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function tz_() { return Session.getScriptTimeZone() || 'Asia/Bangkok'; }

function rowToOrder_(r) {
  var items = [];
  try { items = JSON.parse(r[COL.items] || '[]'); } catch (e) { items = []; }
  return {
    orderId: r[COL.orderId], orderNo: r[COL.orderNo], date: r[COL.date], time: r[COL.time],
    status: r[COL.status], customer: r[COL.customer], note: r[COL.note],
    items: items, total: Number(r[COL.total]) || 0, createdAt: r[COL.createdAt],
  };
}

function cleanText_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max);
}

/* ---------------------------------------------------------
   ลูกค้า: ส่งออเดอร์
   --------------------------------------------------------- */
function submitOrder_(body) {
  var lines = body.lines;
  if (!Array.isArray(lines) || !lines.length) throw userError_('ยังไม่มีรายการอาหารในออเดอร์', 'EMPTY');
  if (lines.length > MAX_LINES) throw userError_('รายการในออเดอร์มากเกินไป', 'TOO_MANY');
  if (!cleanText_(body.customer, 40)) throw userError_('กรุณาใส่ชื่อและจำนวนคนบนโต๊ะ', 'NO_CUSTOMER');

  var cache = CacheService.getScriptCache();
  var minuteKey = 'rate_' + Utilities.formatDate(new Date(), tz_(), 'yyyyMMddHHmm');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = ordersSheet_();
    var clientId = cleanText_(body.clientId, 64);

    /* ส่งซ้ำด้วยรหัสเดิม (เช่น เน็ตหลุดหลังส่ง) → คืนออเดอร์เดิม ไม่สร้างใหม่ */
    var last = sheet.getLastRow();
    var firstScan = Math.max(2, last - 200 + 1);
    var recent = last >= 2 ? sheet.getRange(firstScan, 1, last - firstScan + 1, ORDER_HEADERS.length).getDisplayValues() : [];
    if (clientId) {
      for (var k = recent.length - 1; k >= 0; k--) {
        if (recent[k][COL.clientId] === clientId) return { ok: true, order: rowToOrder_(recent[k]) };
      }
    }

    var count = Number(cache.get(minuteKey) || 0);
    if (count >= MAX_ORDERS_PER_MINUTE) throw userError_('มีออเดอร์เข้ามาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่', 'RATE');

    /* คำนวณราคาจากชีตเอง */
    var menu = readTable_(SHEET_MENU);
    var addonTable = readTable_(SHEET_ADDONS, true);
    var items = [];
    var total = 0;
    lines.forEach(function (ln) {
      var qty = Math.floor(Number(ln.qty));
      if (!(qty >= 1 && qty <= MAX_QTY)) throw userError_('จำนวนไม่ถูกต้อง (สั่งได้ครั้งละ 1–' + MAX_QTY + ' ต่อรายการ)', 'BAD_QTY');
      var id = cleanText_(ln.id, 80), name = cleanText_(ln.name, 120);
      var row = null;
      for (var i = 0; i < menu.length && !row; i++) {
        if ((id && menu[i].id === id) || (!row && menu[i].name && menu[i].name.trim() === name)) row = menu[i];
      }
      if (!row) throw userError_('ไม่พบเมนู "' + name + '" ในร้าน (เมนูอาจถูกเปลี่ยน) กรุณาโหลดหน้าเมนูใหม่', 'NO_ITEM');
      if (!isAvailable_(row.available)) throw userError_('เมนู "' + row.name + '" หมดชั่วคราว', 'SOLD_OUT');
      var base = num_(row.price);
      if (base == null) throw userError_('เมนู "' + row.name + '" ยังไม่มีราคา', 'NO_PRICE');

      var size = ln.size === 'special' ? 'special' : 'normal';
      var unit = base;
      if (size === 'special') {
        var extra = num_(row.special_extra) || 0;
        if (extra <= 0) throw userError_('เมนู "' + row.name + '" ไม่มีแบบพิเศษ', 'NO_SPECIAL');
        unit += extra;
      }

      var addons = [];
      (Array.isArray(ln.addons) ? ln.addons : []).forEach(function (an) {
        var aname = cleanText_(an, 80);
        var found = null;
        addonTable.forEach(function (a) { if (!found && a.name && a.name.trim() === aname) found = a; });
        if (!found || !isAvailable_(found.available) || num_(found.price) == null) {
          throw userError_('ไม่มี "' + aname + '" ให้เลือกแล้ว กรุณาโหลดหน้าเมนูใหม่', 'NO_ADDON');
        }
        var ap = num_(found.price);
        addons.push({ name: found.name.trim(), price: ap });
        unit += ap;
      });

      items.push({ name: row.name.trim(), size: size, addons: addons, qty: qty, unit: unit, lineTotal: unit * qty });
      total += unit * qty;
    });

    /* เลขออเดอร์: เริ่มที่ 001 ใหม่ทุกวัน */
    var now = new Date();
    var date = Utilities.formatDate(now, tz_(), 'yyyy-MM-dd');
    var time = Utilities.formatDate(now, tz_(), 'HH:mm');
    var maxNo = 0;
    recent.forEach(function (r) { if (r[COL.date] === date) maxNo = Math.max(maxNo, Number(r[COL.orderNo]) || 0); });
    var orderNo = ('00' + (maxNo + 1)).slice(-Math.max(3, String(maxNo + 1).length));
    var orderId = date.replace(/-/g, '') + '-' + orderNo;

    var itemsText = items.map(function (it) {
      return it.name + (it.size === 'special' ? ' (พิเศษ)' : '') +
        (it.addons.length ? ' +' + it.addons.map(function (a) { return a.name; }).join(',') : '') + ' x' + it.qty;
    }).join(' | ');

    var rowValues = [];
    rowValues[COL.orderId] = orderId;
    rowValues[COL.orderNo] = orderNo;
    rowValues[COL.date] = date;
    rowValues[COL.time] = time;
    rowValues[COL.status] = 'new';
    rowValues[COL.customer] = cleanText_(body.customer, 40);
    rowValues[COL.note] = cleanText_(body.note, 120);
    rowValues[COL.items] = JSON.stringify(items);
    rowValues[COL.itemsText] = itemsText;
    rowValues[COL.total] = String(total);
    rowValues[COL.clientId] = clientId;
    rowValues[COL.createdAt] = now.toISOString();

    var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, ORDER_HEADERS.length);
    target.setNumberFormat('@');            // ข้อความล้วน: ข้อความที่ลูกค้าพิมพ์ขึ้นต้นด้วย = จะไม่ถูกตีเป็นสูตร
    target.setValues([rowValues]);
    SpreadsheetApp.flush();
    cache.put(minuteKey, String(count + 1), 90);

    return { ok: true, order: rowToOrder_(rowValues) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------------------------------------
   แม่ค้า: ดูออเดอร์ของวันที่ระบุ (yyyy-MM-dd)
   --------------------------------------------------------- */
function listOrders_(date) {
  date = String(date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw userError_('วันที่ไม่ถูกต้อง', 'BAD_DATE');
  var sheet = ordersSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return { ok: true, orders: [] };

  /* หาช่วงแถวของวันนั้นจากคอลัมน์วันที่ก่อน แล้วค่อยอ่านเฉพาะช่วงนั้น */
  var dates = sheet.getRange(2, COL.date + 1, last - 1, 1).getDisplayValues();
  var first = -1, end = -1;
  for (var i = 0; i < dates.length; i++) {
    if (dates[i][0] === date) { if (first < 0) first = i; end = i; }
  }
  if (first < 0) return { ok: true, orders: [] };

  var rows = sheet.getRange(first + 2, 1, end - first + 1, ORDER_HEADERS.length).getDisplayValues();
  var orders = rows.filter(function (r) { return r[COL.date] === date; }).map(rowToOrder_);
  return { ok: true, orders: orders };
}

/* ---------------------------------------------------------
   แม่ค้า: เปลี่ยนสถานะ  new | done | cancelled
   --------------------------------------------------------- */
function updateStatus_(orderId, status) {
  if (STATUSES.indexOf(status) === -1) throw userError_('สถานะไม่ถูกต้อง', 'BAD_STATUS');
  orderId = String(orderId || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = ordersSheet_();
    var last = sheet.getLastRow();
    if (last < 2) throw userError_('ไม่พบออเดอร์นี้', 'NOT_FOUND');
    var ids = sheet.getRange(2, COL.orderId + 1, last - 1, 1).getDisplayValues();
    for (var i = ids.length - 1; i >= 0; i--) {
      if (ids[i][0] === orderId) {
        var rowNo = i + 2;
        sheet.getRange(rowNo, COL.status + 1).setValue(status);
        var row = sheet.getRange(rowNo, 1, 1, ORDER_HEADERS.length).getDisplayValues()[0];
        return { ok: true, order: rowToOrder_(row) };
      }
    }
    throw userError_('ไม่พบออเดอร์นี้', 'NOT_FOUND');
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------------------------------------
   รันครั้งเดียวตอนติดตั้ง: สร้างแท็บ Orders / Addons และตรวจรหัส
   (เลือกฟังก์ชัน setup แล้วกด "เรียกใช้")
   --------------------------------------------------------- */
function setup() {
  ordersSheet_();
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(SHEET_ADDONS)) {
    var s = ss.insertSheet(SHEET_ADDONS);
    s.getRange(1, 1, 1, 4).setValues([['name', 'price', 'available', 'for']]).setFontWeight('bold');
    s.getRange(2, 1, 3, 4).setValues([
      ['ไข่ดาว', 10, 'TRUE', ''],
      ['ไข่ต้ม', 10, 'TRUE', ''],
      ['เป็ดเพิ่ม', 30, 'TRUE', ''],
    ]);
    s.setFrozenRows(1);
  }
  if (!PropertiesService.getScriptProperties().getProperty('SELLER_PIN')) {
    throw new Error('ยังไม่ได้ตั้ง SELLER_PIN: ไปที่ ตั้งค่าโปรเจ็กต์ (รูปเฟือง) > Script properties > เพิ่มชื่อ SELLER_PIN แล้วใส่รหัสของแม่ค้า');
  }
  console.log('พร้อมใช้งานแล้ว — ขั้นต่อไป: Deploy > New deployment > Web app');
}
