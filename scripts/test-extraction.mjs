import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const testFiles = [
  {
    name: 'M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf',
    expectedPart: '260703 0047 C',
    expectedFpLeftAvg: 19,
    expectedFfpLeftTol: 20,
    expectedFHbetaLeftTolUpper: 30,
    expectedFHbetaLeftTolLower: -38,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260704  0048 B_04.11.2026_04.00.48.pdf',
    expectedPart: '260704 0048 B',
    expectedFpLeftAvg: 30,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260704 0004 B_04.11.2026_01.57.35.pdf',
    expectedPart: '260704 0004 B',
    expectedFpLeftAvg: 27,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260704 0036 B_03.11.2026_18.10.23.pdf',
    expectedPart: '260704 0036 B',
    expectedFpLeftAvg: 34,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260707 0045 C_04.11.2026_01.10.57.pdf',
    expectedPart: '260707 0045 C',
    expectedFpLeftAvg: 30,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260707 0057 C_04.11.2026_03.40.26.pdf',
    expectedPart: '260707 0057 C',
    expectedFpLeftAvg: 36,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260707 0058 C_04.11.2026_04.05.09.pdf',
    expectedPart: '260707 0058 C',
    expectedFpLeftAvg: 33,
    expectedOriginalStatus: 'not OK',
  },
  {
    name: 'M0166472_Z43_K13_260707 0060 C_04.11.2026_05.26.52.pdf',
    expectedPart: '260707 0060 C',
    expectedFpLeftAvg: 41,
    expectedOriginalStatus: 'not OK',
  },
];

async function runRegressionSuite() {
  console.log('======================================================================');
  console.log('   MECHREPORT AI: REGRESSION TEST SUITE (8 REFERENCE REPORTS)        ');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  for (const sample of testFiles) {
    totalTests++;
    let pdfPath = path.join(rootDir, 'public', 'reference-reports', sample.name);
    if (!fs.existsSync(pdfPath)) {
      pdfPath = path.join(rootDir, sample.name);
    }
    if (!fs.existsSync(pdfPath)) {
      console.error(`[FAIL] File not found: ${pdfPath}`);
      continue;
    }

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    const page = await doc.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items
      .map((it) => ({
        str: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
      }))
      .filter((i) => i.str.length > 0);

    // Extract drawing number
    const dwgLabel = items.find((i) => i.str.includes('Zeichnungsnummer:'));
    const dwgItems = items.filter(
      (i) => Math.abs(i.y - (dwgLabel?.y || 788.6)) < 4 && i.x > 150 && i.x < 240
    ).sort((a, b) => a.x - b.x);
    const dwgVal = dwgItems.map((i) => i.str).join(' ');

    // Extract part number
    const partLabel = items.find((i) => i.str.includes('Part number'));
    const partItems = items.filter(
      (i) => Math.abs(i.y - (partLabel?.y || 774.5)) < 4 && i.x > 150 && i.x < 250
    ).sort((a, b) => a.x - b.x);
    const partVal = partItems.map((i) => i.str).join(' ');

    // Extract status
    const statusVal = items.find(
      (i) =>
        i.x > 490 &&
        i.y > 730 &&
        i.y < 750 &&
        (i.str.toLowerCase() === 'not ok' || i.str.toLowerCase() === 'ok')
    )?.str;

    // Extract Fp Left Avg (x around 188.9, y around 85.7)
    const fpLeftAvg = items.find(
      (i) => Math.abs(i.y - 85.7) < 3 && i.x >= 180 && i.x <= 205
    )?.str;

    // Assertions
    const dwgOk = dwgVal === 'M0166472_Z43_K13';
    const partOk = partVal === sample.expectedPart;
    const statusOk = statusVal === sample.expectedOriginalStatus;
    const fpOk = parseFloat(fpLeftAvg) === sample.expectedFpLeftAvg;

    if (dwgOk && partOk && statusOk && fpOk) {
      console.log(`[PASS] ${sample.name}`);
      console.log(`       Dwg: ${dwgVal} | Part: ${partVal} | Status: ${statusVal} | Fp Avg: ${fpLeftAvg}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${sample.name}`);
      console.error(`       Dwg: ${dwgVal} (expected M0166472_Z43_K13)`);
      console.error(`       Part: "${partVal}" (expected "${sample.expectedPart}")`);
      console.error(`       Status: ${statusVal} (expected ${sample.expectedOriginalStatus})`);
      console.error(`       Fp Avg: ${fpLeftAvg} (expected ${sample.expectedFpLeftAvg})`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Test Result: ${passedTests} / ${totalTests} sample reports passed.`);
  console.log('----------------------------------------------------------------------\n');

  if (passedTests === totalTests) {
    console.log('ALL 8 REFERENCE REPORTS VERIFIED ACCURATELY.\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRegressionSuite().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
