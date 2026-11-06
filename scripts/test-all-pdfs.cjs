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

async function parsePdf(fileName) {
  const filePath = path.resolve(fileName);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();

  const items = content.items.map(it => ({
    str: it.str.trim(),
    x: Math.round(it.transform[4] * 10) / 10,
    y: Math.round(it.transform[5] * 10) / 10,
    w: Math.round(it.width * 10) / 10,
    h: Math.round(it.height * 10) / 10,
  })).filter(i => i.str.length > 0);

  // Reconstruct vertical margin text (x around 51.4)
  const verticalItems = items.filter(i => Math.abs(i.x - 51.4) < 3).sort((a, b) => b.y - a.y);
  const verticalStr = verticalItems.map(i => i.str).join('');

  // Extract date from vertical string: "date: 04.11.2026 04:18:09" or similar
  const dateMatch = verticalStr.match(/date:\s*(\d{2}\.\d{2}\.\d{4})\s*(\d{2}:\d{2}:\d{2})/);
  const fileMatch = verticalStr.match(/file:\s*(\d+)/);
  const gearProMatch = verticalStr.match(/GEAR[^\d]*PRO\s*([\d\s\w\.\(\)]+)/i);

  // Metadata in top header
  const findNear = (x, y, maxXDist = 120, maxYDist = 4) => {
    return items.filter(i => Math.abs(i.y - y) <= maxYDist && i.x > x && (i.x - x) <= maxXDist)
      .sort((a, b) => a.x - b.x).map(i => i.str).join(' ');
  };

  const findLabel = (label) => items.find(i => i.str.toLowerCase().includes(label.toLowerCase()));

  // Drawing number
  const dwgLabel = findLabel('Zeichnungsnummer:');
  const drawing_number = dwgLabel ? findNear(dwgLabel.x + 60, dwgLabel.y, 80) : '';

  // AE-Stand
  const aeLabel = findLabel('AE-Stand:');
  const ae_revision = aeLabel ? findNear(aeLabel.x + 30, aeLabel.y, 90) : '';

  // Part number incr.
  const partLabel = findLabel('Part number');
  const part_number = partLabel ? findNear(partLabel.x + 60, partLabel.y, 80) : '';

  // Prüfer
  const pruferLabel = findLabel('Prüfer:');
  const examiner = pruferLabel ? findNear(pruferLabel.x + 20, pruferLabel.y, 80) : '';

  // Status
  const statusItem = items.find(i => (i.y > 730 && i.y < 750 && (i.str.toLowerCase() === 'ok' || i.str.toLowerCase() === 'not ok')));
  const original_status = statusItem ? statusItem.str : 'UNKNOWN';

  // Table items: Y bands:
  // Row 1 (Fp): 83 < y < 88
  // Row 2 (ffp): 71 < y < 77
  // Row 3 (fHβ): 59 < y < 67
  // Row 4 (vfHβ): 48 < y < 55
  const extractRowValues = (minY, maxY) => {
    return items.filter(i => i.y >= minY && i.y <= maxY && i.x >= 100 && i.x <= 570)
      .sort((a, b) => a.x - b.x);
  };

  return {
    fileName,
    drawing_number,
    ae_revision,
    part_number,
    examiner,
    original_status,
    inspection_date: dateMatch ? dateMatch[1] : '',
    inspection_time: dateMatch ? dateMatch[2] : '',
    file_id: fileMatch ? fileMatch[1] : '',
    rowFp: extractRowValues(83, 88).map(i => `[x=${i.x}] ${i.str}`),
    rowFfp: extractRowValues(71, 77).map(i => `[x=${i.x}] ${i.str}`),
    rowFHbeta: extractRowValues(59, 67).map(i => `[x=${i.x}] ${i.str}`),
    rowVfHbeta: extractRowValues(48, 55).map(i => `[x=${i.x}] ${i.str}`),
  };
}

(async () => {
  for (const f of files) {
    const res = await parsePdf(f);
    console.log(`\n================== ${f} ==================`);
    console.log(`Dwg: "${res.drawing_number}", Part: "${res.part_number}", AE: "${res.ae_revision}", Status: "${res.original_status}"`);
    console.log(`Date: ${res.inspection_date} ${res.inspection_time}, FileID: ${res.file_id}`);
    console.log(`Row Fp:`, res.rowFp.join(', '));
    console.log(`Row ffp:`, res.rowFfp.join(', '));
    console.log(`Row fHβ:`, res.rowFHbeta.join(', '));
    console.log(`Row vfHβ:`, res.rowVfHbeta.join(', '));
  }
})();

