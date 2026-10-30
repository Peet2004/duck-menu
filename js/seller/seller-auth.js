/* js/seller/seller-auth.js — เข้าสู่ระบบแม่ค้าด้วยรหัส (ตรวจรหัสที่ฝั่ง Google Apps Script ไม่ได้เก็บรหัสไว้ในเว็บ) */
import { $ } from '../shared/utils.js';
import { CONFIG, isDemo } from '../shared/config.js';
import { ICONS } from '../shared/icons.js';

const KEY = CONFIG.SELLER_PIN_KEY;

export const getPin = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
export const savePin = pin => { try { sessionStorage.setItem(KEY, pin); } catch { /* ignore */ } };
export const clearPin = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } };

/** วาดหน้าเข้าสู่ระบบ — onLogin(pin) ต้องคืน Promise (โยน error ถ้ารหัสผิด) */
export function initLogin({ onLogin }) {
  const form = $('#loginForm'), input = $('#pinInput'), err = $('#loginError'), btn = $('#loginBtn');
  $('#loginIcon').innerHTML = ICONS.lock;
  $('#demoHint').hidden = !isDemo;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pin = input.value.trim();
    if (!pin) return;
    err.hidden = true;
    btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ…';
    try {
      await onLogin(pin);
      input.value = '';
    } catch (ex) {
      err.textContent = ex.message || 'เข้าสู่ระบบไม่สำเร็จ';
      err.hidden = false;
      input.select();
    } finally {
      btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
    }
  });
}

export function showLogin(show) {
  $('#loginView').hidden = !show;
  $('#dashView').hidden = show;
  if (show) $('#pinInput').focus();
}
