import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import ExcelJS from 'exceljs';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXPECTED_HEADERS = ['Job No', 'Ø', '33', '23', '12', '1', '1', '12', '23', '33', 'Ø'];

const EXPECTED_FH_DATA = [
  {
    jobNo: '260703 0047 C',
    values: [13, 10, 32, 6, 6, -9, -29, -6, -19, -16],
  },
  {
    jobNo: '260704 0048 B',
    values: [7, 4, -33, 19, 39, 37, -23, -28, 13, 0],
  },
  {
    jobNo: '260704 0004 B',
    values: [22, 29, 0, 33, 24, -15, 4, -34, -35, -20],
  },
  {
    jobNo: '260704 0036 B',
    values: [25, 38, 58, 14, -11, -45, 2, -10, -32, -21],
  },
  {
    jobNo: '260707 0045 C',
    values: [10, -26, 11, 41, 14, 12, 26, -18, -49, -7],
  },
  {
    jobNo: '260707 0057 C',
    values: [25, 41, 2, -9, 67, 2, -90, -8, 42, -14],
  },
  {
    jobNo: '260707 0058 C',
    values: [8, -3, -30, 13, 55, 30, -17, -44, 4, -7],
  },
  {
    jobNo: '260707 0060 C',
    values: [21, -18, -8, 70, 39, 19, 8, -49, -33, -13],
  },
];

function toNumericMeasurement(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    return toNumericMeasurement(val[0]);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '/' ||
      trimmed === '...' ||
      trimmed === '—'
    ) {
      return null;
    }
    const cleaned = trimmed.replace(/[\[\]\(\)\s"]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

async function runJobWiseExportTest() {
  console.log('======================================================================');
  console.log('   MECHREPORT AI: JOB-WISE EXCEL EXPORT (NUMERIC FIX VERIFICATION)   ');
  console.log('======================================================================\n');

  // Verify toNumericMeasurement unit tests for user-reported inputs
  const sampleInputs = ['[16]', '[7]', '[-21]', '[0]', '[-61]'];
  const expectedOutputs = [16, 7, -21, 0, -61];
  for (let i = 0; i < sampleInputs.length; i++) {
    const conv = toNumericMeasurement(sampleInputs[i]);
    if (conv !== expectedOutputs[i] || typeof conv !== 'number') {
      throw new Error(`Failed conversion for ${sampleInputs[i]}: got ${conv}`);
    }
  }
  console.log('[PASS] Sample input conversions verified: [16]->16, [7]->7, [-21]->-21, [0]->0, [-61]->-61');

  const refDir = path.join(rootDir, 'public', 'reference-reports');
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

  const COLS = [
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
  ];

  const extractedRows = [];

  for (const f of files) {
    const pdfPath = path.join(refDir, f);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
    const p = await doc.getPage(1);
    const c = await p.getTextContent();
    const items = c.items.map(it => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] })).filter(i => i.str.length > 0);

    // Part number
    const partLabel = items.find(i => i.str.includes('Part number'));
    const partVal = items.filter(i => Math.abs(i.y - (partLabel?.y || 774.5)) < 4 && i.x > 150 && i.x < 250).sort((a,b) => a.x - b.x).map(i => i.str).join(' ');

    // fHβ row (y between 59 and 67)
    const rowItems = items.filter(i => i.y >= 59 && i.y <= 67);
    const values = COLS.map(col => {
      const matches = rowItems.filter(i => i.x >= col.minX && i.x <= col.maxX);
      const parsed = matches.map(m => toNumericMeasurement(m.str)).filter(v => v !== null);
      return parsed.length > 0 ? parsed[0] : null;
    });

    extractedRows.push({
      jobNo: partVal,
      values,
    });
  }

  // Build the Excel workbook using ExcelJS exactly as the application does
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Measurement Report', { views: [{ showGridLines: true }] });

  ws.columns = [
    { header: 'Job No', key: 'jobNo', width: 22 },
    { header: 'Ø', key: 'leftAvg', width: 12 },
    { header: '33', key: 'leftT33', width: 12 },
    { header: '23', key: 'leftT23', width: 12 },
    { header: '12', key: 'leftT12', width: 12 },
    { header: '1', key: 'leftT1', width: 12 },
    { header: '1', key: 'rightT1', width: 12 },
    { header: '12', key: 'rightT12', width: 12 },
    { header: '23', key: 'rightT23', width: 12 },
    { header: '33', key: 'rightT33', width: 12 },
    { header: 'Ø', key: 'rightAvg', width: 12 },
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell(cell => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cell.border = thinBorder;
  });

  extractedRows.forEach(r => {
    const formatCell = (val) => {
      const num = toNumericMeasurement(val);
      return num !== null ? num : '';
    };

    const rowValues = [r.jobNo, ...r.values.map(formatCell)];
    const dataRow = ws.addRow(rowValues);
    dataRow.height = 20;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
      if (colNum > 1 && typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
  });

  const exportPath = path.join(rootDir, 'Job_Wise_Measurement_Report.xlsx');
  await wb.xlsx.writeFile(exportPath);
  console.log(`[OK] Generated Excel file: ${exportPath}`);

  // Now Read Back and Validate Against Acceptance Criteria
  const verifyWb = new ExcelJS.Workbook();
  await verifyWb.xlsx.readFile(exportPath);
  const verifyWs = verifyWb.getWorksheet('Measurement Report');

  let passedAssertions = 0;
  let totalAssertions = 0;

  function assert(condition, message) {
    totalAssertions++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedAssertions++;
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  console.log('\n--- VERIFYING ACCEPTANCE CRITERIA ---');

  // 1. Worksheet Name
  assert(verifyWs.name === 'Measurement Report', 'Worksheet name is "Measurement Report"');

  // 2. Exactly 11 Columns
  assert(verifyWs.columnCount === 11, `Exactly 11 columns (found ${verifyWs.columnCount})`);

  // 3. Exactly 8 Data Rows + 1 Header Row
  assert(verifyWs.rowCount === 9, `Exactly 8 job rows + 1 header row (found ${verifyWs.rowCount} total rows)`);

  // 4. Header Values
  const readHeaders = verifyWs.getRow(1).values.slice(1);
  const headersMatch = JSON.stringify(readHeaders) === JSON.stringify(EXPECTED_HEADERS);
  assert(headersMatch, `Header values match: [${readHeaders.join(', ')}]`);

  // 5. Column Widths
  assert(verifyWs.getColumn(1).width === 22, `Job No column width is 22 (found ${verifyWs.getColumn(1).width})`);
  assert(verifyWs.getColumn(2).width === 12, `Measurement column width is 12 (found ${verifyWs.getColumn(2).width})`);

  // 6. Data Row Values (Verify all 8 parts, negative numbers, zeros, NO brackets, strictly numeric)
  let bracketFound = false;
  let allNumeric = true;

  for (let idx = 0; idx < EXPECTED_FH_DATA.length; idx++) {
    const expected = EXPECTED_FH_DATA[idx];
    const row = verifyWs.getRow(idx + 2);
    const rowValues = row.values.slice(1);
    const readJobNo = rowValues[0];
    const readMeas = rowValues.slice(1);

    const jobNoMatch = readJobNo === expected.jobNo;
    const measMatch = JSON.stringify(readMeas) === JSON.stringify(expected.values);

    assert(jobNoMatch, `Row ${idx + 1} Job No is "${readJobNo}" (expected "${expected.jobNo}")`);
    assert(measMatch, `Row ${idx + 1} Measurements: [${readMeas.join(', ')}]`);

    // Verify cell types and absence of square brackets
    for (let c = 2; c <= 11; c++) {
      const cellVal = row.getCell(c).value;
      const strVal = String(cellVal);
      if (strVal.includes('[') || strVal.includes(']')) {
        bracketFound = true;
      }
      if (typeof cellVal !== 'number') {
        allNumeric = false;
        console.error(`  [FAIL] Row ${idx + 1} Col ${c} is not numeric: type=${typeof cellVal}, val=${cellVal}`);
      }
    }
  }

  assert(!bracketFound, 'Zero measurement cells contain square brackets "[" or "]"');
  assert(allNumeric, 'All 80 measurement cells are strictly numeric (typeof value === "number")');

  // Verify negative numbers preservation
  const row1Cell7 = verifyWs.getRow(2).getCell(7).value;
  assert(row1Cell7 === -9 && typeof row1Cell7 === 'number', `Negative value -9 preserved as number: ${row1Cell7}`);

  // Verify zero preservation
  const row2Cell11 = verifyWs.getRow(3).getCell(11).value;
  assert(row2Cell11 === 0 && typeof row2Cell11 === 'number', `Zero value 0 preserved as number: ${row2Cell11}`);

  console.log('\n----------------------------------------------------------------------');
  console.log(`Verification Result: ${passedAssertions} / ${totalAssertions} assertions passed.`);
  console.log('----------------------------------------------------------------------\n');

  // Clean up test file
  if (fs.existsSync(exportPath)) {
    fs.unlinkSync(exportPath);
  }

  if (passedAssertions === totalAssertions) {
    console.log('ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY.\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runJobWiseExportTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
