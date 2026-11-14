// サクセスの仲間の立ち絵（オリジナル。表情つき）
const SK = '#f7d5b5', LN = '#5a3b2c';

const CH = {
  haruka: { hair: '#b5653f', iris: '#c0566e', cloth: '#ff8fb1', cloth2: '#ffffff', blush: 1 },
  goda: { hair: '#262626', iris: '#4a3320', cloth: '#f2f2f2', cloth2: '#1d2f66', wide: 1 },
  kuro: { hair: '#26304a', iris: '#3f6aa8', cloth: '#1d2f66', cloth2: '#ffffff', sharp: 1 },
  kantoku: { hair: '#5d5d5d', iris: '#3a2a1a', cloth: '#2f3542', cloth2: '#c9a227', old: 1 },
  mame: { hair: '#6b4a2a', iris: '#5b3a1c', cloth: '#f2f2f2', cloth2: '#1d2f66', glasses: 1 },
};

export function portrait(id, face = 'normal') {
  const c = CH[id];
  if (!c) return '';
  const w = c.wide ? 4 : 0;
  const facePath = `M${30 - w} 54 Q${30 - w} ${92 + w} 60 ${104 + w * 0.5} Q${90 + w} ${92 + w} ${90 + w} 54 Q${90 + w} 22 60 22 Q${30 - w} 22 ${30 - w} 54Z`;
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
  ${hairBack(id, c)}
  ${clothes(id, c)}
  <path d="M50 96 L50 116 L70 116 L70 96Z" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>
  <ellipse cx="${29 - w}" cy="64" rx="5" ry="8" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>
  <ellipse cx="${91 + w}" cy="64" rx="5" ry="8" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>
  <path d="${facePath}" fill="${SK}" stroke="${LN}" stroke-width="2"/>
  ${c.old ? `<path d="M40 88 Q60 108 80 88 Q78 100 60 104 Q42 100 40 88Z" fill="#8a8a8a" opacity=".35"/>` : ''}
  ${c.blush || face === 'smile' ? `<ellipse cx="42" cy="78" rx="6" ry="3" fill="#ff8a8a" opacity=".45"/><ellipse cx="78" cy="78" rx="6" ry="3" fill="#ff8a8a" opacity=".45"/>` : ''}
  ${id === 'mame' ? `<g fill="#c98a5a" opacity=".7"><circle cx="40" cy="76" r="1.2"/><circle cx="44" cy="79" r="1.2"/><circle cx="37" cy="80" r="1.2"/><circle cx="80" cy="76" r="1.2"/><circle cx="76" cy="79" r="1.2"/><circle cx="83" cy="80" r="1.2"/></g>` : ''}
  ${id === 'goda' ? `<g transform="rotate(-20 82 80)"><rect x="76" y="77" width="13" height="6" rx="2" fill="#f0c9a0" stroke="#b08a6a" stroke-width="1"/><line x1="82" y1="77" x2="82" y2="83" stroke="#b08a6a" stroke-width="1"/></g>` : ''}
  ${eyes(id, c, face)}
  ${brows(c, face)}
  <path d="M60 70 Q58 77 61 79" fill="none" stroke="${LN}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  ${mouth(c, face)}
  ${c.old ? `<path d="M48 86 Q54 82 60 85 Q66 82 72 86 Q66 89 60 87 Q54 89 48 86Z" fill="#4a4a4a"/>` : ''}
  ${hairFront(id, c)}
  ${c.glasses ? `<g fill="none" stroke="#3a2a1a" stroke-width="2.4"><circle cx="46" cy="65" r="10"/><circle cx="74" cy="65" r="10"/><path d="M56 64 Q60 61 64 64"/><path d="M36 63 L30 60M84 63 L90 60"/></g><g fill="#fff" opacity=".12"><circle cx="46" cy="65" r="9"/><circle cx="74" cy="65" r="9"/></g>` : ''}
  ${c.old ? `<g><rect x="34" y="57" width="22" height="13" rx="5" fill="#1d2330"/><rect x="64" y="57" width="22" height="13" rx="5" fill="#1d2330"/><path d="M56 61 L64 61" stroke="#1d2330" stroke-width="3"/><path d="M37 60 L46 60" stroke="#fff" stroke-width="2" opacity=".5"/><path d="M67 60 L76 60" stroke="#fff" stroke-width="2" opacity=".5"/></g>` : ''}
</svg>`;
}

function clothes(id, c) {
  if (id === 'haruka') return `<path d="M14 150 Q16 118 50 112 L70 112 Q104 118 106 150Z" fill="${c.cloth}" stroke="${LN}" stroke-width="2"/>
    <path d="M60 114 L60 150" stroke="#fff" stroke-width="3"/><path d="M50 112 L60 124 L70 112" fill="#fff" stroke="${LN}" stroke-width="1.5"/>
    <path d="M44 114 L40 150 M76 114 L80 150" stroke="#fff" stroke-width="2" opacity=".7"/>`;
  if (id === 'kantoku') return `<path d="M12 150 Q14 116 50 110 L70 110 Q106 116 108 150Z" fill="${c.cloth}" stroke="${LN}" stroke-width="2"/>
    <path d="M50 110 L60 130 L70 110" fill="#e8e8e8" stroke="${LN}" stroke-width="1.5"/><path d="M28 124 L40 120" stroke="${c.cloth2}" stroke-width="3"/>`;
  return `<path d="M12 150 Q14 116 50 110 L70 110 Q106 116 108 150Z" fill="${c.cloth}" stroke="${LN}" stroke-width="2"/>
    <path d="M48 110 L60 126 L72 110" fill="none" stroke="${c.cloth2}" stroke-width="4"/>
    <path d="M60 126 L60 150" stroke="${c.cloth2}" stroke-width="2" opacity=".6"/>`;
}

function hairBack(id, c) {
  if (id === 'haruka') return `<path d="M24 58 Q20 20 60 14 Q100 20 96 58 L100 112 Q86 120 76 108 L44 108 Q34 120 20 112Z" fill="${c.hair}" stroke="${LN}" stroke-width="2"/>
    <path d="M94 34 Q118 46 110 92 Q106 70 96 58Z" fill="${c.hair}" stroke="${LN}" stroke-width="2"/>`;
  return '';
}
function hairFront(id, c) {
  const H = c.hair;
  if (id === 'haruka') return `<path d="M28 56 Q26 18 60 16 Q96 18 92 56 Q84 40 72 36 Q70 46 60 48 Q62 40 56 36 Q46 46 34 48 Q32 52 28 56Z" fill="${H}" stroke="${LN}" stroke-width="2"/>
    <path d="M88 30 l10 -8 l2 12 l10 -2 l-6 10 z" fill="#ff5c8a" stroke="${LN}" stroke-width="1.5"/>
    <path d="M44 24 Q56 20 66 22" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/>`;
  if (id === 'goda') return `<path d="M26 52 Q24 18 60 16 Q96 18 94 52 Q92 36 84 32 Q60 26 36 32 Q28 36 26 52Z" fill="${H}" stroke="${LN}" stroke-width="2"/>
    <g fill="#fff" opacity=".18">${Array.from({ length: 14 }, (_, i) => `<circle cx="${34 + i * 4}" cy="${26 + Math.sin(i) * 3}" r="1"/>`).join('')}</g>`;
  if (id === 'kuro') return `<path d="M26 60 L20 40 L32 42 L28 22 L42 30 L48 12 L58 26 L68 10 L74 26 L88 16 L88 32 L100 30 L92 46 L98 58 Q92 48 84 44 L86 70 L74 46 L66 58 L62 42 L52 54 L50 40 L40 50 L34 46Z" fill="${H}" stroke="${LN}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M52 20 L60 28" stroke="#6f86b8" stroke-width="2" opacity=".6"/>`;
  if (id === 'kantoku') return `<path d="M24 52 Q22 16 60 14 Q98 16 96 52 L24 52Z" fill="#1d2f66" stroke="${LN}" stroke-width="2"/>
    <path d="M18 54 Q60 38 102 54 Q100 60 60 52 Q20 60 18 54Z" fill="#162550" stroke="${LN}" stroke-width="2"/>
    <path d="M28 56 L28 72 M92 56 L92 72" stroke="${H}" stroke-width="4"/>
    <circle cx="60" cy="18" r="3" fill="#162550"/>`;
  if (id === 'mame') return `<path d="M26 64 Q20 16 60 16 Q100 16 94 64 Q92 50 88 48 L32 48 Q28 50 26 64Z" fill="${H}" stroke="${LN}" stroke-width="2"/>
    <path d="M32 48 L88 48" stroke="${LN}" stroke-width="1.5"/>
    <path d="M40 24 Q56 18 70 22" stroke="#fff" stroke-width="2" opacity=".3" fill="none"/>`;
  return '';
}

function eyes(id, c, face) {
  if (c.old) return ''; // サングラス
  const one = (x, flip) => {
    if (face === 'smile') return `<path d="M${x - 8} 66 Q${x} 58 ${x + 8} 66" fill="none" stroke="${LN}" stroke-width="3" stroke-linecap="round"/>`;
    const h = face === 'surprise' ? 9 : c.sharp ? 5.5 : id === 'haruka' ? 8 : 7;
    const ix = c.sharp ? 4.2 : 5;
    return `<ellipse cx="${x}" cy="65" rx="7" ry="${h}" fill="#fff" stroke="${LN}" stroke-width="1.8"/>
      <ellipse cx="${x + (flip ? -0.5 : 0.5)}" cy="${66}" rx="${ix}" ry="${Math.min(h, 6.5)}" fill="${c.iris}"/>
      <ellipse cx="${x}" cy="67" rx="2.2" ry="3" fill="#1a1a1a"/>
      <circle cx="${x - 2}" cy="63" r="1.8" fill="#fff"/>
      <path d="M${x - 8} ${65 - h} Q${x} ${63 - h - 2} ${x + 8} ${65 - h}" fill="none" stroke="${LN}" stroke-width="2.6" stroke-linecap="round"/>
      ${id === 'haruka' ? `<path d="M${flip ? x - 8 : x + 8} ${65 - h} l${flip ? -3 : 3} -2" stroke="${LN}" stroke-width="2"/>` : ''}`;
  };
  return one(46, true) + one(74, false);
}
function brows(c, face) {
  const col = c.old ? '#5d5d5d' : c.hair, sw = c.wide ? 5 : 3;
  const B = {
    normal: ['M38 52 Q46 49 53 52', 'M67 52 Q74 49 82 52'],
    smile: ['M38 52 Q46 48 53 51', 'M67 51 Q74 48 82 52'],
    angry: ['M38 49 L53 55', 'M67 55 L82 49'],
    sad: ['M38 54 L53 49', 'M67 49 L82 54'],
    surprise: ['M38 47 Q46 43 53 47', 'M67 47 Q74 43 82 47'],
  }[face] || [];
  return B.map(d => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`).join('');
}
function mouth(c, face) {
  if (face === 'smile') return `<path d="M50 84 Q60 96 70 84 Z" fill="#a8323c" stroke="${LN}" stroke-width="1.8"/><path d="M53 85 L67 85" stroke="#fff" stroke-width="2"/>`;
  if (face === 'angry') return `<path d="M51 90 Q60 84 69 90" fill="none" stroke="${LN}" stroke-width="2.4" stroke-linecap="round"/><path d="M53 89 L67 89" stroke="#fff" stroke-width="1.5"/>`;
  if (face === 'sad') return `<path d="M53 90 Q60 86 67 90" fill="none" stroke="${LN}" stroke-width="2.2" stroke-linecap="round"/>`;
  if (face === 'surprise') return `<ellipse cx="60" cy="89" rx="4.5" ry="5.5" fill="#a8323c" stroke="${LN}" stroke-width="1.8"/>`;
  if (c.old) return '';
  return `<path d="M54 87 Q60 90 66 87" fill="none" stroke="${LN}" stroke-width="2.2" stroke-linecap="round"/>`;
}
