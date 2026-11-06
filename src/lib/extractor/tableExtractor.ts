import {
  ExtractedMeasurementTable,
  MeasurementRow,
  FlankMeasurement,
} from '@/types/inspection';
import { ExtractedTextItem } from './metadataExtractor';

interface ColumnDef {
  key: string;
  minX: number;
  maxX: number;
}

const TABLE_COLUMNS: ColumnDef[] = [
  { key: 'left_tol', minX: 145, maxX: 175 },
  { key: 'left_avg', minX: 180, maxX: 205 },
  { key: 'left_t33', minX: 210, maxX: 235 },
  { key: 'left_t23', minX: 240, maxX: 265 },
  { key: 'left_t12', minX: 270, maxX: 295 },
  { key: 'left_t1', minX: 300, maxX: 324 },
  { key: 'left_qa', minX: 325, maxX: 345 },
  { key: 'right_qa', minX: 345, maxX: 365 },
  { key: 'right_t1', minX: 366, maxX: 390 },
  { key: 'right_t12', minX: 395, maxX: 420 },
  { key: 'right_t23', minX: 425, maxX: 450 },
  { key: 'right_t33', minX: 455, maxX: 480 },
  { key: 'right_avg', minX: 485, maxX: 510 },
  { key: 'right_qn', minX: 510, maxX: 535 },
  { key: 'right_tol', minX: 545, maxX: 575 },
];

export function extractMeasurementTable(items: ExtractedTextItem[]): {
  table: ExtractedMeasurementTable;
  warnings: string[];
} {
  const warnings: string[] = [];
  const teeth_numbers = ['33', '23', '12', '1'];

  const parseNum = (val: string): number | null => {
    if (!val || val === '-' || val === '/' || val === '...') return null;
    const clean = val.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  };

  // Helper to extract a single row's cell data
  const extractRowData = (minY: number, maxY: number) => {
    const rowItems = items.filter(
      (i) => i.y >= minY && i.y <= maxY && i.x >= 140 && i.x <= 575
    );
    const data: Record<string, number | number[] | null> = {};

    for (const col of TABLE_COLUMNS) {
      const matching = rowItems.filter(
        (i) => i.x >= col.minX && i.x <= col.maxX
      );
      if (matching.length === 1) {
        data[col.key] = parseNum(matching[0].str);
      } else if (matching.length > 1) {
        // e.g., upper and lower tolerances stacked vertically
        const nums = matching
          .map((m) => parseNum(m.str))
          .filter((n): n is number => n !== null);
        data[col.key] = nums.sort((a, b) => b - a); // [upper, lower]
      } else {
        data[col.key] = null;
      }
    }
    return data;
  };

  // 1. Fp (Total lead deviation) ~ y: 83 to 88
  const fpData = extractRowData(83, 88);
  const rowFp: MeasurementRow = {
    name: 'Fp',
    label: 'Fβ / Fp',
    unit: 'µm',
    description: 'Total lead/profile measurement deviation (ISO 1328-1)',
    left: {
      qn: null,
      tol_upper: null,
      tol_lower: null,
      avg: fpData.left_avg as number | null,
      teeth: {
        '33': fpData.left_t33 as number | null,
        '23': fpData.left_t23 as number | null,
        '12': fpData.left_t12 as number | null,
        '1': fpData.left_t1 as number | null,
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': fpData.right_t1 as number | null,
        '12': fpData.right_t12 as number | null,
        '23': fpData.right_t23 as number | null,
        '33': fpData.right_t33 as number | null,
      },
      avg: fpData.right_avg as number | null,
      qn: null,
      tol_upper: null,
      tol_lower: null,
    },
  };

  // 2. ffp (Lead form deviation) ~ y: 71 to 77
  const ffpData = extractRowData(71, 77);
  const leftTolFfp = typeof ffpData.left_tol === 'number' ? ffpData.left_tol : 20;
  const rightTolFfp = typeof ffpData.right_tol === 'number' ? ffpData.right_tol : 20;

  const rowFfp: MeasurementRow = {
    name: 'ffp',
    label: 'ffβ / ffp',
    unit: 'µm',
    description: 'Lead form deviation (crowning form variation)',
    left: {
      qn: null,
      tol_upper: leftTolFfp,
      tol_lower: null,
      avg: ffpData.left_avg as number | null,
      teeth: {
        '33': ffpData.left_t33 as number | null,
        '23': ffpData.left_t23 as number | null,
        '12': ffpData.left_t12 as number | null,
        '1': ffpData.left_t1 as number | null,
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': ffpData.right_t1 as number | null,
        '12': ffpData.right_t12 as number | null,
        '23': ffpData.right_t23 as number | null,
        '33': ffpData.right_t33 as number | null,
      },
      avg: ffpData.right_avg as number | null,
      qn: null,
      tol_upper: rightTolFfp,
      tol_lower: null,
    },
  };

  // 3. fHβ (Lead slope deviation) ~ y: 59 to 67
  const fHData = extractRowData(59, 67);
  let leftUpperFH = 30;
  let leftLowerFH = -38;
  if (Array.isArray(fHData.left_tol)) {
    leftUpperFH = fHData.left_tol[0];
    leftLowerFH = fHData.left_tol[1];
  }

  let rightUpperFH = 30;
  let rightLowerFH = -37;
  if (Array.isArray(fHData.right_tol)) {
    rightUpperFH = fHData.right_tol[0];
    rightLowerFH = fHData.right_tol[1];
  }

  const rowFHbeta: MeasurementRow = {
    name: 'fHbeta',
    label: 'fHβ',
    unit: 'µm',
    description: 'Lead slope deviation (helix angle error)',
    left: {
      qn: null,
      tol_upper: leftUpperFH,
      tol_lower: leftLowerFH,
      avg: fHData.left_avg as number | null,
      teeth: {
        '33': fHData.left_t33 as number | null,
        '23': fHData.left_t23 as number | null,
        '12': fHData.left_t12 as number | null,
        '1': fHData.left_t1 as number | null,
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': fHData.right_t1 as number | null,
        '12': fHData.right_t12 as number | null,
        '23': fHData.right_t23 as number | null,
        '33': fHData.right_t33 as number | null,
      },
      avg: fHData.right_avg as number | null,
      qn: null,
      tol_upper: rightUpperFH,
      tol_lower: rightLowerFH,
    },
  };

  // 4. vfHβ (Crowning deviation) ~ y: 48 to 56
  // Usually appears as two values near the center: one for left flank, one for right flank
  const vfLeftItem = items.find(
    (i) => i.y >= 48 && i.y <= 56 && i.x >= 295 && i.x <= 340
  );
  const vfRightItem = items.find(
    (i) => i.y >= 48 && i.y <= 56 && i.x >= 355 && i.x <= 400
  );

  const leftCrowning = vfLeftItem ? parseNum(vfLeftItem.str) : null;
  const rightCrowning = vfRightItem ? parseNum(vfRightItem.str) : null;

  const rowVfHbeta: MeasurementRow = {
    name: 'vfHbeta',
    label: 'vfHβ',
    unit: 'µm',
    description: 'Lead crowning amount / modification variation',
    left: {
      qn: null,
      tol_upper: null,
      tol_lower: null,
      avg: null,
      teeth: {},
      qa: null,
      crowning_value: leftCrowning,
    },
    right: {
      qa: null,
      teeth: {},
      avg: null,
      qn: null,
      tol_upper: null,
      tol_lower: null,
      crowning_value: rightCrowning,
    },
  };

  return {
    table: {
      rows: [rowFp, rowFfp, rowFHbeta, rowVfHbeta],
      teeth_numbers,
    },
    warnings,
  };
}

