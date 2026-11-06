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

export function toNumericMeasurement(val: any): number | null {
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

export function extractMeasurementTable(items: ExtractedTextItem[]): {
  table: ExtractedMeasurementTable;
  warnings: string[];
} {
  const warnings: string[] = [];
  const teeth_numbers = ['33', '23', '12', '1'];

  const parseNum = (val: string): number | null => {
    return toNumericMeasurement(val);
  };

  // Helper to extract a single row's cell data
  const extractRowData = (minY: number, maxY: number) => {
    const rowItems = items.filter(
      (i) => i.y >= minY && i.y <= maxY && i.x >= 140 && i.x <= 575 && i.str.trim().length > 0
    );
    const data: Record<string, number | number[] | null> = {};

    for (const col of TABLE_COLUMNS) {
      const matching = rowItems.filter(
        (i) => i.x >= col.minX && i.x <= col.maxX
      );
      const isToleranceCol = col.key === 'left_tol' || col.key === 'right_tol';

      const nums = matching
        .map((m) => toNumericMeasurement(m.str))
        .filter((n): n is number => n !== null);

      if (isToleranceCol) {
        if (nums.length === 1) {
          data[col.key] = nums[0];
        } else if (nums.length > 1) {
          data[col.key] = nums.sort((a, b) => b - a);
        } else {
          data[col.key] = null;
        }
      } else {
        // Measurement column: MUST ALWAYS be an individual number or null, NEVER an array
        if (nums.length > 0) {
          data[col.key] = nums[0];
        } else {
          data[col.key] = null;
        }
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
      avg: toNumericMeasurement(fpData.left_avg),
      teeth: {
        '33': toNumericMeasurement(fpData.left_t33),
        '23': toNumericMeasurement(fpData.left_t23),
        '12': toNumericMeasurement(fpData.left_t12),
        '1': toNumericMeasurement(fpData.left_t1),
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': toNumericMeasurement(fpData.right_t1),
        '12': toNumericMeasurement(fpData.right_t12),
        '23': toNumericMeasurement(fpData.right_t23),
        '33': toNumericMeasurement(fpData.right_t33),
      },
      avg: toNumericMeasurement(fpData.right_avg),
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
      avg: toNumericMeasurement(ffpData.left_avg),
      teeth: {
        '33': toNumericMeasurement(ffpData.left_t33),
        '23': toNumericMeasurement(ffpData.left_t23),
        '12': toNumericMeasurement(ffpData.left_t12),
        '1': toNumericMeasurement(ffpData.left_t1),
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': toNumericMeasurement(ffpData.right_t1),
        '12': toNumericMeasurement(ffpData.right_t12),
        '23': toNumericMeasurement(ffpData.right_t23),
        '33': toNumericMeasurement(ffpData.right_t33),
      },
      avg: toNumericMeasurement(ffpData.right_avg),
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
      avg: toNumericMeasurement(fHData.left_avg),
      teeth: {
        '33': toNumericMeasurement(fHData.left_t33),
        '23': toNumericMeasurement(fHData.left_t23),
        '12': toNumericMeasurement(fHData.left_t12),
        '1': toNumericMeasurement(fHData.left_t1),
      },
      qa: null,
    },
    right: {
      qa: null,
      teeth: {
        '1': toNumericMeasurement(fHData.right_t1),
        '12': toNumericMeasurement(fHData.right_t12),
        '23': toNumericMeasurement(fHData.right_t23),
        '33': toNumericMeasurement(fHData.right_t33),
      },
      avg: toNumericMeasurement(fHData.right_avg),
      qn: null,
      tol_upper: rightUpperFH,
      tol_lower: rightLowerFH,
    },
  };

  // 4. vfHβ (Crowning deviation) ~ y: 48 to 56
  // Usually appears as two values near the center: one for left flank, one for right flank
  const vfLeftItem = items.find(
    (i) => i.y >= 48 && i.y <= 56 && i.x >= 295 && i.x <= 340 && i.str.trim().length > 0
  );
  const vfRightItem = items.find(
    (i) => i.y >= 48 && i.y <= 56 && i.x >= 355 && i.x <= 400 && i.str.trim().length > 0
  );

  const leftCrowning = vfLeftItem ? toNumericMeasurement(vfLeftItem.str) : null;
  const rightCrowning = vfRightItem ? toNumericMeasurement(vfRightItem.str) : null;

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

