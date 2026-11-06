import { InspectionReport } from '@/types/inspection';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { toNumericMeasurement } from '@/lib/extractor/tableExtractor';

export type MeasurementRowType = 'Fp' | 'ffp' | 'fHbeta' | 'vfHbeta';

export interface JobWiseRow {
  reportId: string;
  jobNumber: string; // Job No from Part number incr.
  leftAvg: number | null; // Ø
  leftT33: number | null; // 33
  leftT23: number | null; // 23
  leftT12: number | null; // 12
  leftT1: number | null; // 1
  rightT1: number | null; // 1
  rightT12: number | null; // 12
  rightT23: number | null; // 23
  rightT33: number | null; // 33
  rightAvg: number | null; // Ø
  hasMissingValues: boolean;
  isDuplicate: boolean;
}

export const JOB_WISE_HEADERS = [
  'Job No',
  'Ø',
  '33',
  '23',
  '12',
  '1',
  '1',
  '12',
  '23',
  '33',
  'Ø',
];

export const MEASUREMENT_TYPE_LABELS: Record<MeasurementRowType, { name: string; unit: string; desc: string }> = {
  fHbeta: {
    name: 'fHβ',
    unit: 'µm',
    desc: 'Lead Slope Deviation (Helix angle error)',
  },
  ffp: {
    name: 'ffβ / ffp',
    unit: 'µm',
    desc: 'Lead Form Deviation',
  },
  Fp: {
    name: 'Fβ / Fp',
    unit: 'µm',
    desc: 'Total Lead Measurement Deviation',
  },
  vfHbeta: {
    name: 'vfHβ',
    unit: 'µm',
    desc: 'Lead Crowning Modification',
  },
};

/**
 * Extracts and maps rows from inspected reports into the 11-column Job-wise format.
 */
export function extractJobWiseData(
  reports: InspectionReport[],
  measurementType: MeasurementRowType
): JobWiseRow[] {
  const seenJobNumbers = new Set<string>();
  const duplicateJobNumbers = new Set<string>();

  // Check for duplicates
  reports.forEach((r) => {
    const jobNo = r.part_number.trim();
    if (seenJobNumbers.has(jobNo)) {
      duplicateJobNumbers.add(jobNo);
    } else {
      seenJobNumbers.add(jobNo);
    }
  });

  return reports.map((r) => {
    const jobNo = r.part_number.trim();
    const row = r.measurements.rows.find((x) => x.name === measurementType);

    let leftAvg: number | null = null;
    let leftT33: number | null = null;
    let leftT23: number | null = null;
    let leftT12: number | null = null;
    let leftT1: number | null = null;
    let rightT1: number | null = null;
    let rightT12: number | null = null;
    let rightT23: number | null = null;
    let rightT33: number | null = null;
    let rightAvg: number | null = null;

    if (measurementType === 'vfHbeta') {
      leftT1 = toNumericMeasurement(row?.left.crowning_value);
      rightT1 = toNumericMeasurement(row?.right.crowning_value);
    } else {
      leftAvg = toNumericMeasurement(row?.left.avg);
      leftT33 = toNumericMeasurement(row?.left.teeth?.['33']);
      leftT23 = toNumericMeasurement(row?.left.teeth?.['23']);
      leftT12 = toNumericMeasurement(row?.left.teeth?.['12']);
      leftT1 = toNumericMeasurement(row?.left.teeth?.['1']);
      rightT1 = toNumericMeasurement(row?.right.teeth?.['1']);
      rightT12 = toNumericMeasurement(row?.right.teeth?.['12']);
      rightT23 = toNumericMeasurement(row?.right.teeth?.['23']);
      rightT33 = toNumericMeasurement(row?.right.teeth?.['33']);
      rightAvg = toNumericMeasurement(row?.right.avg);
    }

    const values =
      measurementType === 'vfHbeta'
        ? [leftT1, rightT1]
        : [leftAvg, leftT33, leftT23, leftT12, leftT1, rightT1, rightT12, rightT23, rightT33, rightAvg];

    const hasMissingValues = values.some((v) => v === null || v === undefined);

    return {
      reportId: r.report_id,
      jobNumber: jobNo,
      leftAvg,
      leftT33,
      leftT23,
      leftT12,
      leftT1,
      rightT1,
      rightT12,
      rightT23,
      rightT33,
      rightAvg,
      hasMissingValues,
      isDuplicate: duplicateJobNumbers.has(jobNo),
    };
  });
}

/**
 * Generates the clean Job-Wise Measurement Report Excel workbook.
 * Matches the reference design with exactly 11 columns, centered alignment,
 * thin borders, white background header, and exact column widths.
 */
export async function createJobWiseWorkbook(
  rows: JobWiseRow[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MechReport AI';
  wb.lastModifiedBy = 'MechReport AI';
  wb.created = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet('Measurement Report', {
    views: [{ showGridLines: true }],
  });

  // 1. Column definitions with explicit widths
  // Job No width: 22, measurement columns: 12
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

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // 2. Format Header Row
  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
    };
    cell.border = thinBorder;
  });

  // 3. Add Data Rows
  rows.forEach((r) => {
    const toCellVal = (val: any): number | string => {
      const num = toNumericMeasurement(val);
      return num !== null ? num : '';
    };

    const rowValues = [
      r.jobNumber.trim(),
      toCellVal(r.leftAvg),
      toCellVal(r.leftT33),
      toCellVal(r.leftT23),
      toCellVal(r.leftT12),
      toCellVal(r.leftT1),
      toCellVal(r.rightT1),
      toCellVal(r.rightT12),
      toCellVal(r.rightT23),
      toCellVal(r.rightT33),
      toCellVal(r.rightAvg),
    ];

    const dataRow = ws.addRow(rowValues);
    dataRow.height = 20;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;

      // Ensure proper numeric formatting for measurement cells
      if (colNumber > 1 && typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
  });

  return wb;
}

/**
 * Downloads the Job-Wise Excel report in the browser.
 */
export async function downloadJobWiseExcel(
  rows: JobWiseRow[],
  fileName = 'Job_Wise_Measurement_Report.xlsx'
): Promise<void> {
  const wb = await createJobWiseWorkbook(rows);
  const buffer = await wb.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Comprehensive Multi-sheet Excel Summary (Optional secondary export).
 */
export function exportReportsToExcel(
  reports: InspectionReport[],
  fileName = 'MechReport_Inspection_Summary.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master Summary
  const summaryData = reports.map((r) => {
    const fp = r.measurements.rows.find((x) => x.name === 'Fp');
    const ffp = r.measurements.rows.find((x) => x.name === 'ffp');
    const fH = r.measurements.rows.find((x) => x.name === 'fHbeta');
    const vfH = r.measurements.rows.find((x) => x.name === 'vfHbeta');

    return {
      'Job No': r.part_number,
      'Drawing Number': r.drawing_number,
      'Inspection Date': r.metadata.inspection_date,
      'Inspection Time': r.metadata.inspection_time,
      'Original Status': r.original_status,
      'Calculated Status': r.calculated_status,
      'Status Details': r.analysis.status_explanation,
      'Confidence (%)': r.analysis.confidence_score,
      'Violations Count': r.analysis.violations.length,
      'Fp Left Avg (µm)': toNumericMeasurement(fp?.left.avg) ?? '',
      'Fp Right Avg (µm)': toNumericMeasurement(fp?.right.avg) ?? '',
      'ffp Left Avg (µm)': toNumericMeasurement(ffp?.left.avg) ?? '',
      'ffp Right Avg (µm)': toNumericMeasurement(ffp?.right.avg) ?? '',
      'fHβ Left Avg (µm)': toNumericMeasurement(fH?.left.avg) ?? '',
      'fHβ Right Avg (µm)': toNumericMeasurement(fH?.right.avg) ?? '',
      'vfHβ Left Crown (µm)': toNumericMeasurement(vfH?.left.crowning_value) ?? '',
      'vfHβ Right Crown (µm)': toNumericMeasurement(vfH?.right.crowning_value) ?? '',
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Detailed Measurements
  const detailedRows: any[] = [];
  reports.forEach((r) => {
    r.measurements.rows.forEach((row) => {
      detailedRows.push({
        'Job No': r.part_number,
        'Drawing Number': r.drawing_number,
        'Parameter': row.label,
        'Unit': row.unit,
        'Description': row.description,
        'Left Tol Upper': toNumericMeasurement(row.left.tol_upper) ?? '',
        'Left Tol Lower': toNumericMeasurement(row.left.tol_lower) ?? '',
        'Left Avg': toNumericMeasurement(row.left.avg) ?? '',
        'Left Tooth 33': toNumericMeasurement(row.left.teeth['33']) ?? '',
        'Left Tooth 23': toNumericMeasurement(row.left.teeth['23']) ?? '',
        'Left Tooth 12': toNumericMeasurement(row.left.teeth['12']) ?? '',
        'Left Tooth 1': toNumericMeasurement(row.left.teeth['1']) ?? '',
        'Left Crowning': toNumericMeasurement(row.left.crowning_value) ?? '',
        'Right Tooth 1': toNumericMeasurement(row.right.teeth['1']) ?? '',
        'Right Tooth 12': toNumericMeasurement(row.right.teeth['12']) ?? '',
        'Right Tooth 23': toNumericMeasurement(row.right.teeth['23']) ?? '',
        'Right Tooth 33': toNumericMeasurement(row.right.teeth['33']) ?? '',
        'Right Avg': toNumericMeasurement(row.right.avg) ?? '',
        'Right Tol Upper': toNumericMeasurement(row.right.tol_upper) ?? '',
        'Right Tol Lower': toNumericMeasurement(row.right.tol_lower) ?? '',
        'Right Crowning': toNumericMeasurement(row.right.crowning_value) ?? '',
      });
    });
  });

  const wsDetails = XLSX.utils.json_to_sheet(detailedRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Measurements');

  // Trigger download
  XLSX.writeFile(wb, fileName);
}
