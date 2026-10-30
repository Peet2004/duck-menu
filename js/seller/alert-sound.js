/* js/seller/alert-sound.js — เสียงเตือนเมื่อมีออเดอร์ใหม่ (ต้องให้แม่ค้ากดเปิดเสียงก่อน เบราว์เซอร์จึงอนุญาต) */
let ctx = null;

export function enableSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = ctx || new AC();
  if (ctx.state === 'suspended') ctx.resume();
  beep();            // เล่นเสียงทดสอบ 1 ครั้งเพื่อให้รู้ว่าเสียงเปิดแล้ว
  return true;
}

export function disableSound() { ctx = null; }
export const soundReady = () => !!ctx;

export function beep() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [[880, 0], [1175, 0.18], [880, 0.36]].forEach(([freq, at]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + 0.18);
  });
}
