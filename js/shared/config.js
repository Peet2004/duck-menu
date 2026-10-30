/* =========================================================
   js/shared/config.js — ค่าตั้งต้นทั้งหมด (แก้ที่ไฟล์นี้ไฟล์เดียว)

   MENU_CSV_URL    ลิงก์ CSV ของแท็บ "Menu"   (Google Sheet > เผยแพร่ไปยังเว็บ)
   ADDONS_CSV_URL  ลิงก์ CSV ของแท็บ "Addons" (เว้นว่างไว้ = ยังไม่มีของเพิ่ม)
   ORDER_API_URL   ลิงก์ Web App ของ Google Apps Script (ลงท้าย /exec)
                   สำหรับรับออเดอร์ / ให้แม่ค้าดูออเดอร์  (ดู README-TH.md)

   เปิดหน้าด้วย  ?demo  เพื่อลองระบบทั้งหมดโดยไม่ต้องตั้งค่าอะไร
   (ข้อมูลเมนูเป็นตัวอย่าง ออเดอร์เก็บในเบราว์เซอร์เครื่องนี้ รหัสแม่ค้าสำหรับทดลอง = 1234)
   ========================================================= */

export const CONFIG = {
  MENU_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoxj4eo1qkqykKLMKRosfJQYkxrdMiDq-M8Kucf-DIBvMemgL8cmKuQxonDr6EHs-2ktvrrfpbs9CB/pub?gid=0&single=true&output=csv',
  ADDONS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoxj4eo1qkqykKLMKRosfJQYkxrdMiDq-M8Kucf-DIBvMemgL8cmKuQxonDr6EHs-2ktvrrfpbs9CB/pub?gid=1428750612&single=true&output=csv',
  ORDER_API_URL: 'https://script.google.com/macros/s/AKfycbzXMIp3DrLV19iGL3mosxAQ_TpA-zxG9ccUYVRRffRVOi1xkPvZbk4YJZUfwaaYq12f-w/exec',

  AUTO_REFRESH_MS: 5 * 60 * 1000,   // ลูกค้า: รีเฟรชเมนูจากชีตทุก 5 นาที
  SELLER_POLL_MS: 10 * 1000,        // แม่ค้า: เช็กออเดอร์ใหม่ทุก 10 วินาที
  MAX_QTY: 20,                      // จำนวนสูงสุดต่อรายการ

  MENU_CACHE_KEY: 'bangkapi-menu-v2',
  CART_KEY: 'bangkapi-cart-v1',
  DEMO_ORDERS_KEY: 'bangkapi-demo-orders-v1',
  SELLER_PIN_KEY: 'bangkapi-seller-pin',
  DEMO_PIN: '1234',
};

export const isDemo = new URLSearchParams(location.search).has('demo');
