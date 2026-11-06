import { InspectionReport } from '@/types/inspection';
import * as XLSX from 'xlsx';

export function exportReportsToExcel(reports: InspectionReport[], fileName = 'MechReport_Inspection_Export.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master Summary
  const summaryData = reports.map((r) => {
    const fp = r.measurements.rows.find((x) => x.name === 'Fp');
    const ffp = r.measurements.rows.find((x) => x.name === 'ffp');
    const fH = r.measurements.rows.find((x) => x.name === 'fHbeta');
    const vfH = r.measurements.rows.find((x) => x.name === 'vfHbeta');

    return {
      'Report ID': r.report_id,
      'File Name': r.file_name,
      'Drawing Number': r.drawing_number,
      'Part Number': r.part_number,
      'Inspection Date': r.metadata.inspection_date,
      'Inspection Time': r.metadata.inspection_time,
      'Original Status': r.original_status,
      'Calculated Status': r.calculated_status,
      'Status Details': r.analysis.status_explanation,
      'Confidence (%)': r.analysis.confidence_score,
      'Violations Count': r.analysis.violations.length,
      'Fp Left Avg (µm)': fp?.left.avg ?? '',
      'Fp Right Avg (µm)': fp?.right.avg ?? '',
      'ffp Left Avg (µm)': ffp?.left.avg ?? '',
      'ffp Right Avg (µm)': ffp?.right.avg ?? '',
      'fHβ Left Avg (µm)': fH?.left.avg ?? '',
      'fHβ Right Avg (µm)': fH?.right.avg ?? '',
      'vfHβ Left Crown (µm)': vfH?.left.crowning_value ?? '',
      'vfHβ Right Crown (µm)': vfH?.right.crowning_value ?? '',
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Detailed Measurements
  const detailedRows: any[] = [];
  reports.forEach((r) => {
    r.measurements.rows.forEach((row) => {
      detailedRows.push({
        'Part Number': r.part_number,
        'Drawing Number': r.drawing_number,
        'Parameter': row.label,
        'Unit': row.unit,
        'Description': row.description,
        'Left Tol Upper': row.left.tol_upper ?? '',
        'Left Tol Lower': row.left.tol_lower ?? '',
        'Left Avg': row.left.avg ?? '',
        'Left Tooth 33': row.left.teeth['33'] ?? '',
        'Left Tooth 23': row.left.teeth['23'] ?? '',
        'Left Tooth 12': row.left.teeth['12'] ?? '',
        'Left Tooth 1': row.left.teeth['1'] ?? '',
        'Left Crowning': row.left.crowning_value ?? '',
        'Right Tooth 1': row.right.teeth['1'] ?? '',
        'Right Tooth 12': row.right.teeth['12'] ?? '',
        'Right Tooth 23': row.right.teeth['23'] ?? '',
        'Right Tooth 33': row.right.teeth['33'] ?? '',
        'Right Avg': row.right.avg ?? '',
        'Right Tol Upper': row.right.tol_upper ?? '',
        'Right Tol Lower': row.right.tol_lower ?? '',
        'Right Crowning': row.right.crowning_value ?? '',
      });
    });
  });

  const wsDetails = XLSX.utils.json_to_sheet(detailedRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Measurements');

  // Sheet 3: Violations Log
  const violationRows: any[] = [];
  reports.forEach((r) => {
    r.analysis.violations.forEach((v) => {
      violationRows.push({
        'Part Number': r.part_number,
        'Drawing Number': r.drawing_number,
        'Parameter': v.rowLabel,
        'Side': v.side.toUpperCase(),
        'Tooth': v.tooth || 'Avg',
        'Measured Value (µm)': v.value,
        'Upper Limit': v.upperLimit ?? 'N/A',
        'Lower Limit': v.lowerLimit ?? 'N/A',
        'Deviation (µm)': v.difference,
        'Explanation': v.message,
      });
    });
  });

  if (violationRows.length > 0) {
    const wsViolations = XLSX.utils.json_to_sheet(violationRows);
    XLSX.utils.book_append_sheet(wb, wsViolations, 'Tolerance Violations');
  }

  // Trigger download
  XLSX.writeFile(wb, fileName);
}

