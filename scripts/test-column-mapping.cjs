const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

const files = [
  'M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf',
  'M0166472_Z43_K13_260704  0048 B_04.11.2026_04.00.48.pdf',
  'M0166472_Z43_K13_260704 0004 B_04.11.2026_01.57.35.pdf',
  'M0166472_Z43_K13_260704 0036 B_03.11.2026_18.10.23.pdf',
  'M0166472_Z43_K13_260707 0045 C_04.11.2026_01.10.57.pdf',
  'M0166472_Z43_K13_260707 0057 C_04.11.2026_03.40.26.pdf',
  'M0166472_Z43_K13_260707 0058 C_04.11.2026_04.05.09.pdf',
  'M0166472_Z43_K13_260707 0060 C_04.11.2026_05.26.52.pdf',
];

const COLUMNS = [
  { key: 'left_tol', minX: 145, maxX: 175 },
  { key: 'left_avg', minX: 180, maxX: 205 },
  { key: 'left_t33', minX: 210, maxX: 235 },
  { key: 'left_t23', minX: 240, maxX: 265 },
  { key: 'left_t12', minX: 270, maxX: 295 },
  { key: 'left_t1',  minX: 300, maxX: 324 },
  { key: 'right_t1', minX: 365, maxX: 390 },
  { key: 'right_t12', minX: 395, maxX: 420 },
  { key: 'right_t23', minX: 425, maxX: 450 },
  { key: 'right_t33', minX: 455, maxX: 480 },
  { key: 'right_avg', minX: 485, maxX: 510 },
  { key: 'right_tol', minX: 545, maxX: 570 },
];

async function run() {
  for (const f of files) {
    const data = new Uint8Array(fs.readFileSync(path.resolve(f)));
    const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
    const p = await doc.getPage(1);
    const c = await p.getTextContent();
    const items = c.items.map(it => ({
      s: it.str.trim(),
      x: it.transform[4],
      y: it.transform[5],
    })).filter(i => i.s.length > 0);

    const getRow = (minY, maxY) => {
      const rowItems = items.filter(i => i.y >= minY && i.y <= maxY);
      const row = {};
      for (const col of COLUMNS) {
        const matching = rowItems.filter(i => i.x >= col.minX && i.x <= col.maxX);
        if (matching.length === 1) {
          row[col.key] = parseFloat(matching[0].s);
        } else if (matching.length > 1) {
          // Could be upper/lower tolerance in fHβ
          row[col.key] = matching.map(m => parseFloat(m.s)).sort((a,b) => b-a);
        } else {
          row[col.key] = null;
        }
      }
      return row;
    };

    console.log(`\n=== FILE: ${f} ===`);
    console.log('Fp:   ', JSON.stringify(getRow(83, 88)));
    console.log('ffp:  ', JSON.stringify(getRow(71, 77)));
    console.log('fHβ:  ', JSON.stringify(getRow(59, 67)));
    
    // vfHβ
    const vfItems = items.filter(i => i.y >= 48 && i.y <= 55 && i.x >= 250 && i.x <= 450);
    console.log('vfHβ: ', JSON.stringify(vfItems.map(i => ({ x: Math.round(i.x), val: parseFloat(i.s) }))));
  }
}

run();

