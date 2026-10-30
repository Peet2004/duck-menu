/* js/customer/effects.js — ลูกเล่นเล็ก ๆ: confetti และการ์ดเอียงตามเมาส์ */
import { $, reduced } from '../shared/utils.js';

export function burst(x, y, n = 18) {
  const layer = $('#burst');
  if (reduced || !layer) return;
  const colors = ['#911D1F', '#B83A3C', '#E7B3B0', '#ffffff', '#6C1315'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'confetti';
    const ang = (Math.PI * 2 * i) / n + Math.random() * .5;
    const dist = 60 + Math.random() * 110;
    p.style.setProperty('--x', x + 'px');
    p.style.setProperty('--y', y + 'px');
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist - 40 + 'px');
    p.style.setProperty('--rot', (Math.random() * 540 - 270).toFixed(0) + 'deg');
    p.style.setProperty('--c', colors[i % colors.length]);
    p.style.setProperty('--s', (7 + Math.random() * 7).toFixed(0) + 'px');
    p.style.setProperty('--r', Math.random() > .5 ? '50%' : '3px');
    layer.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

export function bindTilt(container) {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  container.querySelectorAll('.card').forEach(card => {
    let raf = 0;
    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.classList.add('tilting');
        card.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
