import { InspectionReport } from '@/types/inspection';

export function exportReportsToCsv(reports: InspectionReport[]): string {
  const headers = [
    'Report ID',
    'File Name',
    'Drawing Number',
    'Part Number',
    'Inspection Date',
    'Inspection Time',
    'Original Status',
    'Calculated Status',
    'Violations Count',
    'Left Fp Avg (µm)',
    'Left ffp Avg (µm)',
    'Left fHβ Avg (µm)',
    'Left vfHβ (µm)',
    'Right Fp Avg (µm)',
    'Right ffp Avg (µm)',
    'Right fHβ Avg (µm)',
    'Right vfHβ (µm)',
    'Gear Teeth z',
    'Module mn (mm)',
    'Pressure Angle αn (°)',
    'Confidence Score (%)',
  ];

  const rows = reports.map((r) => {
    const fpRow = r.measurements.rows.find((x) => x.name === 'Fp');
    const ffpRow = r.measurements.rows.find((x) => x.name === 'ffp');
    const fHRow = r.measurements.rows.find((x) => x.name === 'fHbeta');
    const vfHRow = r.measurements.rows.find((x) => x.name === 'vfHbeta');

    return [
      `"${r.report_id}"`,
      `"${r.file_name}"`,
      `"${r.drawing_number}"`,
      `"${r.part_number}"`,
      `"${r.metadata.inspection_date}"`,
      `"${r.metadata.inspection_time}"`,
      `"${r.original_status}"`,
      `"${r.calculated_status}"`,
      r.analysis.violations.length,
      fpRow?.left.avg ?? '',
      ffpRow?.left.avg ?? '',
      fHRow?.left.avg ?? '',
      vfHRow?.left.crowning_value ?? '',
      fpRow?.right.avg ?? '',
      ffpRow?.right.avg ?? '',
      fHRow?.right.avg ?? '',
      vfHRow?.right.crowning_value ?? '',
      r.metadata.gear_teeth_z ?? '',
      r.metadata.normal_module_mn ?? '',
      r.metadata.normal_pressure_angle_alpha_n ?? '',
      r.analysis.confidence_score,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

