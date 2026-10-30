/* js/shared/icons.js — ไอคอน SVG ทั้งหมดที่ใช้ในเว็บ */
/* ---------------- ไอคอน ---------------- */
  export const svgIcon = (inner, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;

  export const ICONS = {
    rice: svgIcon('<path d="M3.5 11.5h17c0 4.6-3.3 7.6-8.5 7.6s-8.5-3-8.5-7.6z"/><path d="M9 21.2h6"/><path d="M6.2 11.5C6.6 8 9 6 12 6s5.4 2 5.8 5.5"/><circle cx="9.6" cy="9" r=".7" fill="currentColor" stroke="none"/><circle cx="12.2" cy="8" r=".7" fill="currentColor" stroke="none"/><circle cx="14.6" cy="9.2" r=".7" fill="currentColor" stroke="none"/>'),
    noodle: svgIcon('<path d="M3.5 12.5h17c0 4.4-3.3 7.3-8.5 7.3s-8.5-2.9-8.5-7.3z"/><path d="M8.5 20.5l-.5 1.3M15.5 20.5l.5 1.3"/><path d="M7 12.5c0-2 1.2-2.7 2.2-2.7s2.2.7 2.2 2.7M12.6 12.5c0-2 1.2-2.7 2.2-2.7s2.2.7 2.2 2.7"/><path d="M13.5 3l5.5 7M16.8 2.5l4 6"/>'),
    soup: svgIcon('<path d="M3.5 12.5h17c0 4.4-3.3 7.3-8.5 7.3s-8.5-2.9-8.5-7.3z"/><path d="M9 21.5h6"/><path d="M8 9c-1.1-1.3 1.1-2.1 0-3.6M12 9c-1.1-1.3 1.1-2.1 0-3.6M16 9c-1.1-1.3 1.1-2.1 0-3.6"/>'),
    snack: svgIcon('<path d="M3.8 16.2C3.8 11 7.4 7 12 7s8.2 4 8.2 9.2c0 1.5-1 2.5-2.5 2.5H6.3c-1.5 0-2.5-1-2.5-2.5z"/><path d="M12 7.2c-.5 1.6-.5 3 0 4.4M9 8.4c-.6 1.5-.5 2.8-.2 4M15 8.4c.6 1.5.5 2.8.2 4"/><path d="M8 4.2c-.7-.8.7-1.4 0-2.4M12 4.2c-.7-.8.7-1.4 0-2.4M16 4.2c-.7-.8.7-1.4 0-2.4" stroke-width="1.4"/>'),
    drink: svgIcon('<path d="M6.5 8h11l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H9.2a1.5 1.5 0 0 1-1.5-1.3L6.5 8z"/><path d="M5.5 8h13"/><path d="M13 8l1.8-4.6H18"/><path d="M9.8 14.6h.01M12.2 17h.01M14.4 13.8h.01" stroke-width="2.2"/>'),
    dice: svgIcon('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="8.6" cy="8.6" r="1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8.6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8.6" cy="15.4" r="1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1" fill="currentColor" stroke="none"/>'),
    arrow: svgIcon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    left: svgIcon('<path d="M15 5l-7 7 7 7"/>'),
    right: svgIcon('<path d="M9 5l7 7-7 7"/>'),
    down: svgIcon('<path d="M5 9l7 7 7-7"/>'),
    close: svgIcon('<path d="M6 6l12 12M18 6L6 18"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
    roast: svgIcon('<ellipse cx="14.6" cy="9.4" rx="6.4" ry="5" transform="rotate(-45 14.6 9.4)"/><path d="M10.4 13.6L6 18"/><circle cx="4.6" cy="17.4" r="1.7"/><circle cx="6.6" cy="19.5" r="1.7"/><path d="M13 6.6c1.300-.7 3-.5 4.200.700" stroke-width="1.400"/>'),
    bag: svgIcon('<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.500a3 3 0 0 1 6 0V8"/>'),
    plus: svgIcon('<path d="M12 5v14M5 12h14"/>'),
    minus: svgIcon('<path d="M5 12h14"/>'),
    trash: svgIcon('<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l.8 12.500h9.400L17.500 7M10 11v5.500M14 11v5.500"/>'),
    check: svgIcon('<path d="M5 12.500l4.500 4.500L19 7.500"/>'),
    refresh: svgIcon('<path d="M20 11a8 8 0 0 0-14-4.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.500L20 15M20 20v-5h-5"/>'),
    bell: svgIcon('<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 1.500h-15zM10 20.500h4"/>'),
    lock: svgIcon('<rect x="5" y="10.500" width="14" height="9.500" rx="2.500"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>'),
};

  