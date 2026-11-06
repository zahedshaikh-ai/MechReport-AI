import { InspectionReport } from '@/types/inspection';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportReportToPdf(report: InspectionReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const darkCharcoal = [24, 26, 29] as [number, number, number];
  const industrialOrange = [255, 122, 0] as [number, number, number];
  const redAlert = [239, 68, 68] as [number, number, number];
  const greenOk = [16, 185, 129] as [number, number, number];

  // Header Bar
  doc.setFillColor(...darkCharcoal);
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MECHREPORT AI', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mechanical Quality Inspection Certificate & Audit', 70, 14);

  // Status Badge in Header
  const isOk = report.calculated_status === 'OK';
  const badgeColor = isOk ? greenOk : redAlert;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(165, 6, 35, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(report.calculated_status, 182, 12.5, { align: 'center' });

  // Metadata Card
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text('Part & Document Metadata', 14, 30);

  autoTable(doc, {
    startY: 33,
    head: [['Field', 'Value', 'Field', 'Value']],
    body: [
      ['Drawing No.', report.drawing_number, 'AE-Stand', report.metadata.ae_revision || 'N/A'],
      ['Part No. Incr.', report.part_number, 'Inspection Date/Time', report.inspection_datetime],
      ['Examiner (Prüfer)', report.metadata.examiner, 'Original ZEISS Status', report.original_status],
      ['Standard', report.metadata.inspection_standard, 'Confidence Score', `${report.analysis.confidence_score}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [50, 55, 60], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Gear Specifications
  let curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Gear Specifications (Involute Spur)', 14, curY);

  autoTable(doc, {
    startY: curY + 3,
    head: [['Teeth (z)', 'Module (mn)', 'Press. Angle (αn)', 'Helix (β)', 'Shift (x)', 'Face Width (b)', 'Pitch Dia (d)']],
    body: [
      [
        `${report.metadata.gear_teeth_z ?? 43}`,
        `${report.metadata.normal_module_mn ?? 3.032} mm`,
        `${report.metadata.normal_pressure_angle_alpha_n ?? 28}°`,
        `${report.metadata.helix_angle_beta ?? 0}°`,
        `${report.metadata.profile_shift_x ?? -1.533}`,
        `${report.metadata.face_width_b ?? 38.4} mm`,
        `${report.metadata.pitch_diameter_d ?? 130.372} mm`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [50, 55, 60], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Reconstructed Measurement Table
  curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text('Reconstructed Measurement Matrix (Lead / Involute)', 14, curY);

  const tableBody = report.measurements.rows.map((r) => {
    if (r.name === 'vfHbeta') {
      return [
        r.label,
        r.unit,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        `${r.left.crowning_value ?? '-'}`,
        `${r.right.crowning_value ?? '-'}`,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ];
    }

    const leftTol = r.left.tol_upper !== null
      ? (r.left.tol_lower !== null ? `${r.left.tol_upper} / ${r.left.tol_lower}` : `${r.left.tol_upper}`)
      : '-';

    const rightTol = r.right.tol_upper !== null
      ? (r.right.tol_lower !== null ? `${r.right.tol_upper} / ${r.right.tol_lower}` : `${r.right.tol_upper}`)
      : '-';

    return [
      r.label,
      r.unit,
      leftTol,
      `${r.left.avg ?? '-'}`,
      `${r.left.teeth['33'] ?? '-'}`,
      `${r.left.teeth['23'] ?? '-'}`,
      `${r.left.teeth['12'] ?? '-'}`,
      `${r.left.teeth['1'] ?? '-'}`,
      '-',
      '-',
      `${r.right.teeth['1'] ?? '-'}`,
      `${r.right.teeth['12'] ?? '-'}`,
      `${r.right.teeth['23'] ?? '-'}`,
      `${r.right.teeth['33'] ?? '-'}`,
      `${r.right.avg ?? '-'}`,
      rightTol,
    ];
  });

  autoTable(doc, {
    startY: curY + 3,
    head: [
      [
        { content: 'Lead Parameter', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Left Flank (-)', colSpan: 6, styles: { halign: 'center', fillColor: [40, 80, 120] } },
        { content: 'Crowning', colSpan: 2, styles: { halign: 'center', fillColor: [90, 90, 90] } },
        { content: 'Right Flank (+)', colSpan: 6, styles: { halign: 'center', fillColor: [120, 70, 40] } },
      ],
      ['Param', 'Unit', 'Tol', 'Ø', 'T33', 'T23', 'T12', 'T1', 'L.Crn', 'R.Crn', 'T1', 'T12', 'T23', 'T33', 'Ø', 'Tol'],
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [50, 55, 60], textColor: 255, fontSize: 7, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
  });

  // Out of Tolerance Violations Section
  curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text('Tolerance Compliance Analysis', 14, curY);

  if (report.analysis.violations.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...greenOk);
    doc.text('All measurements conform to the specified ZEISS GEAR PRO tolerances.', 14, curY + 6);
  } else {
    const violationRows = report.analysis.violations.map((v) => [
      v.rowLabel,
      v.side.toUpperCase(),
      v.tooth ? `Tooth ${v.tooth}` : 'Average',
      `${v.value} µm`,
      v.upperLimit !== null ? `${v.upperLimit} µm` : 'N/A',
      v.lowerLimit !== null ? `${v.lowerLimit} µm` : 'N/A',
      `${v.difference > 0 ? '+' : ''}${v.difference} µm`,
      v.message,
    ]);

    autoTable(doc, {
      startY: curY + 3,
      head: [['Param', 'Side', 'Location', 'Measured', 'Upper Tol', 'Lower Tol', 'Deviation', 'Finding']],
      body: violationRows,
      theme: 'grid',
      headStyles: { fillColor: [180, 40, 40], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated by MechReport AI • Report ID: ${report.report_id} • Page ${i} of ${pageCount}`,
      14,
      290
    );
  }

  doc.save(`${report.part_number.replace(/\s+/g, '_')}_Inspection_Report.pdf`);
}

