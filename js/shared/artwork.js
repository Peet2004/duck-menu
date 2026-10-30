/* js/shared/artwork.js — ภาพประกอบ SVG ที่แสดงแทนเมื่อเมนูไม่มีรูปในชีต */
/* ---------------- ภาพประกอบ (เมื่อไม่มีรูปในชีต) ---------------- */
  const SHADOW = (cy, rx) => `<ellipse cx="200" cy="${cy}" rx="${rx}" ry="16" fill="#5a1214" opacity=".14"/>`;
  const BG = '<rect width="400" height="300" fill="#F8EAE8"/><circle cx="200" cy="150" r="140" fill="#F3DCD9"/><circle cx="200" cy="150" r="104" fill="#EFCFCB" opacity=".55"/>';
  const slice = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-30" y="-11" width="60" height="22" rx="9" fill="#7A2E17"/><rect x="-30" y="-11" width="60" height="9" rx="5" fill="#B9581F"/><rect x="-23" y="0" width="46" height="3" rx="1.5" fill="#F2D3A8" opacity=".85"/></g>`;
  const leaf = (x, y, r) => `<rect x="${x}" y="${y}" width="16" height="5" rx="2.5" fill="#5E9B3E" transform="rotate(${r} ${x} ${y})"/>`;
  const bao = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-36 14C-36-20-12-36 0-36S36-20 36 14Q0 28-36 14Z" fill="#fff" stroke="#E2CFCB" stroke-width="3"/><path d="M0-36q-3 9-9 14M0-36q3 9 9 14M0-36v14" stroke="#E2CFCB" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  const bowl = '<path d="M70 140H330C330 214 278 254 200 254S70 214 70 140Z" fill="#fff" stroke="#E2CFCB" stroke-width="3"/><rect x="158" y="250" width="84" height="12" rx="6" fill="#F0E1DD"/>';
  const steam = (xs, y) => `<g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85">${xs.map(x => `<path d="M${x} ${y}c-10-10 10-18 0-30"/>`).join('')}</g>`;

  const ART = {
    rice: () => `${SHADOW(252, 158)}
      <ellipse cx="200" cy="192" rx="162" ry="60" fill="#fff" stroke="#E6D3D0" stroke-width="3"/>
      <ellipse cx="200" cy="190" rx="132" ry="44" fill="#FCF4F2" stroke="#F0E0DD" stroke-width="2"/>
      <path d="M120 192C120 134 156 106 200 106s80 28 80 86c-34 22-126 22-160 0z" fill="#fff" stroke="#E2CFCB" stroke-width="2.5"/>
      <g fill="#EADCD8"><ellipse cx="160" cy="178" rx="4" ry="2"/><ellipse cx="178" cy="188" rx="4" ry="2"/><ellipse cx="226" cy="186" rx="4" ry="2"/><ellipse cx="246" cy="174" rx="4" ry="2"/><ellipse cx="204" cy="192" rx="4" ry="2"/></g>
      ${slice(165, 148, -30)}${slice(236, 148, 30)}${slice(184, 134, -12)}${slice(218, 134, 12)}${slice(200, 156, 0)}
      ${leaf(186, 118, -20)}${leaf(204, 116, 25)}
      <circle cx="116" cy="208" r="15" fill="#CFE5B2" stroke="#7FAE57" stroke-width="3"/><circle cx="116" cy="208" r="8" fill="#E7F3D5"/>
      <circle cx="136" cy="222" r="15" fill="#CFE5B2" stroke="#7FAE57" stroke-width="3"/><circle cx="136" cy="222" r="8" fill="#E7F3D5"/>
      <ellipse cx="292" cy="214" rx="30" ry="12" fill="#fff" stroke="#E2CFCB" stroke-width="2.5"/><ellipse cx="292" cy="212" rx="20" ry="7" fill="#5A2412"/>`,

    roast: () => `${SHADOW(258, 150)}
      <ellipse cx="200" cy="196" rx="170" ry="62" fill="#fff" stroke="#E6D3D0" stroke-width="3"/>
      <ellipse cx="200" cy="194" rx="140" ry="46" fill="#FCF4F2" stroke="#F0E0DD" stroke-width="2"/>
      ${slice(124, 190, -22)}${slice(160, 176, -12)}${slice(200, 170, 0)}${slice(240, 176, 12)}${slice(276, 190, 22)}
      ${slice(144, 208, -8)}${slice(186, 206, 4)}${slice(228, 208, -4)}${slice(266, 210, 10)}
      ${leaf(176, 150, -20)}${leaf(206, 148, 25)}
      <ellipse cx="318" cy="226" rx="30" ry="12" fill="#fff" stroke="#E2CFCB" stroke-width="2.500"/><ellipse cx="318" cy="224" rx="20" ry="7" fill="#5A2412"/>
      ${steam([150, 200, 250], 128)}`,

    noodle: () => `${SHADOW(262, 140)}${bowl}
      <path d="M76 164H324C320 178 316 186 310 194H90C84 186 80 178 76 164Z" fill="#911D1F"/>
      <ellipse cx="200" cy="140" rx="130" ry="26" fill="#FBF3F1" stroke="#E2CFCB" stroke-width="3"/>
      <ellipse cx="200" cy="140" rx="116" ry="20" fill="#F2CF72"/>
      <g fill="none" stroke="#DDA93B" stroke-width="5" stroke-linecap="round"><path d="M100 140q14-13 28 0t28 0t28 0t28 0t28 0t28 0"/><path d="M110 148q14-11 28 0t28 0t28 0t28 0t28 0t24 0"/><path d="M118 132q12-9 24 0t24 0t24 0t24 0t24 0"/></g>
      ${slice(168, 126, -14)}${slice(204, 120, 2)}${slice(240, 126, 16)}${leaf(146, 138, -10)}${leaf(252, 140, 20)}
      ${steam([136, 164, 192], 96)}
      <g stroke="#C79A55" stroke-width="6" stroke-linecap="round"><path d="M270 58L214 128"/><path d="M288 70L228 134"/></g>`,

    soup: () => `${SHADOW(262, 140)}${bowl}
      <path d="M78 170Q200 192 322 170" stroke="#911D1F" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse cx="200" cy="140" rx="130" ry="26" fill="#FBF3F1" stroke="#E2CFCB" stroke-width="3"/>
      <ellipse cx="200" cy="141" rx="116" ry="20" fill="#D9953A"/>
      <ellipse cx="188" cy="138" rx="66" ry="7" fill="#EDBB6E" opacity=".85"/>
      <circle cx="150" cy="144" r="7" fill="#7BAA4B"/><circle cx="170" cy="148" r="5" fill="#7BAA4B"/>
      <ellipse cx="232" cy="140" rx="14" ry="7" fill="#FFF3DA"/><ellipse cx="208" cy="146" rx="10" ry="5" fill="#FFF3DA"/>
      <g fill="#F5CF8A"><circle cx="184" cy="136" r="3"/><circle cx="252" cy="146" r="3"/><circle cx="130" cy="138" r="2.5"/></g>
      ${steam([150, 182, 214], 98)}
      <g transform="rotate(-28 306 122)"><ellipse cx="306" cy="122" rx="19" ry="11" fill="#fff" stroke="#E2CFCB" stroke-width="3"/><rect x="323" y="118" width="54" height="8" rx="4" fill="#fff" stroke="#E2CFCB" stroke-width="2.5"/></g>`,

    snack: () => `${SHADOW(258, 150)}
      <path d="M84 176H316V226C316 238 306 246 294 246H106C94 246 84 238 84 226Z" fill="#D4AE6B" stroke="#A9823F" stroke-width="3"/>
      <path d="M84 198H316M84 220H316" stroke="#A9823F" stroke-width="3" opacity=".55"/>
      <path d="M130 176V246M178 176V246M226 176V246M274 176V246" stroke="#A9823F" stroke-width="2" opacity=".28"/>
      <ellipse cx="200" cy="176" rx="116" ry="26" fill="#EBD4A2" stroke="#A9823F" stroke-width="3"/>
      <ellipse cx="200" cy="177" rx="100" ry="18" fill="#F7E8C6"/>
      ${bao(200, 152, 1)}${bao(148, 178, .92)}${bao(252, 178, .92)}
      <circle cx="200" cy="148" r="4.5" fill="#911D1F"/>
      ${steam([150, 200, 250], 108)}`,

    drink: () => `${SHADOW(260, 132)}
      <g><rect x="262" y="112" width="62" height="134" rx="13" fill="#911D1F"/><rect x="262" y="150" width="62" height="42" fill="#fff"/><circle cx="293" cy="171" r="11" fill="#911D1F"/><ellipse cx="293" cy="112" rx="31" ry="7" fill="#C9484B"/><ellipse cx="293" cy="112" rx="18" ry="4" fill="#7A1517"/></g>
      <path d="M96 76H206L194 240Q193 252 181 252H121Q109 252 108 240Z" fill="#fff" fill-opacity=".6" stroke="#E2CFCB" stroke-width="3"/>
      <path d="M101 106H201L191 238Q190 246 182 246H120Q112 246 111 238Z" fill="#4A1A14"/>
      <ellipse cx="151" cy="106" rx="50" ry="7" fill="#C98A6A"/>
      <g fill="#fff" opacity=".4"><rect x="118" y="124" width="30" height="30" rx="7" transform="rotate(-12 133 139)"/><rect x="152" y="146" width="30" height="30" rx="7" transform="rotate(10 167 161)"/><rect x="124" y="176" width="28" height="28" rx="7" transform="rotate(6 138 190)"/></g>
      <g fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"><circle cx="170" cy="204" r="5"/><circle cx="182" cy="188" r="3.5"/><circle cx="130" cy="222" r="4"/></g>
      <path d="M166 102L190 40H216" stroke="#911D1F" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(98 80)"><circle r="21" fill="#F6DE6B" stroke="#E6BE2C" stroke-width="3"/><circle r="15" fill="#FBEFA0"/><path d="M0-15V15M-15 0H15M-10.6-10.6L10.6 10.6M10.6-10.6L-10.6 10.6" stroke="#F0D048" stroke-width="2"/></g>`,
  };

  export const artSVG = key => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${BG}${(ART[key] || ART.rice)()}</svg>`;

  