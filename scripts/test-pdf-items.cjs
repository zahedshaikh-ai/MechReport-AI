const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

const pdfPath = path.resolve('M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf');
const data = new Uint8Array(fs.readFileSync(pdfPath));

const loadingTask = pdfjsLib.getDocument({
  data,
  useSystemFonts: true,
  disableFontFace: true,
});

loadingTask.promise.then(async (doc) => {
  console.log('PDF loaded, numPages:', doc.numPages);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  console.log('Viewport:', viewport.width, 'x', viewport.height);
  const content = await page.getTextContent();
  console.log('Text items count:', content.items.length);
  
  const items = content.items.map((it) => ({
    str: it.str,
    x: Math.round(it.transform[4] * 10) / 10,
    y: Math.round(it.transform[5] * 10) / 10,
    w: Math.round(it.width * 10) / 10,
    h: Math.round(it.height * 10) / 10,
    font: it.fontName,
  }));

  // Sort top-to-bottom
  items.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  console.log('--- ALL EXTRACTED ITEMS (top to bottom) ---');
  for (const it of items) {
    if (it.str.trim()) {
      console.log(`x=${it.x.toString().padStart(6)}, y=${it.y.toString().padStart(6)}, w=${it.w.toString().padStart(5)}: "${it.str}"`);
    }
  }
}).catch(err => {
  console.error('Error loading PDF:', err);
});

