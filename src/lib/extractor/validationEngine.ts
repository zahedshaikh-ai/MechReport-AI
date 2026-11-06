import {
  ExtractedMeasurementTable,
  InspectionAnalysis,
  InspectionStatus,
  OutOfToleranceViolation,
  ToleranceConfig,
} from '@/types/inspection';

export function analyzeInspection(
  original_status: string,
  table: ExtractedMeasurementTable,
  userTolerance?: ToleranceConfig | null
): InspectionAnalysis {
  const violations: OutOfToleranceViolation[] = [];
  const missing_measurements: string[] = [];
  const warnings: string[] = [];

  const teeth = table.teeth_numbers; // ['33', '23', '12', '1']

  // Check each row
  for (const row of table.rows) {
    // If row is vfHbeta, it only has crowning values
    if (row.name === 'vfHbeta') {
      if (row.left.crowning_value === null && row.right.crowning_value === null) {
        missing_measurements.push('vfHβ crowning values missing');
      }
      continue;
    }

    // Check Left Side
    for (const t of teeth) {
      const val = row.left.teeth[t];
      if (val === null || val === undefined) {
        missing_measurements.push(`Left flank ${row.label} tooth ${t} is missing`);
      } else {
        // Tolerances: use userTolerance if provided, otherwise extracted tolerances
        let upper = row.left.tol_upper;
        let lower = row.left.tol_lower;

        if (userTolerance) {
          if (row.name === 'ffp') upper = userTolerance.ffp_upper;
          if (row.name === 'fHbeta') {
            upper = userTolerance.fHbeta_upper;
            lower = userTolerance.fHbeta_lower;
          }
        }

        if (upper !== null && val > upper) {
          const diff = Math.round((val - upper) * 10) / 10;
          violations.push({
            rowName: row.name,
            rowLabel: row.label,
            side: 'left',
            tooth: t,
            value: val,
            upperLimit: upper,
            lowerLimit: lower,
            difference: diff,
            message: `Left Flank Tooth ${t} ${row.label} of ${val} µm exceeds upper limit of ${upper} µm (+${diff} µm)`,
          });
        }

        if (lower !== null && val < lower) {
          const diff = Math.round((lower - val) * 10) / 10;
          violations.push({
            rowName: row.name,
            rowLabel: row.label,
            side: 'left',
            tooth: t,
            value: val,
            upperLimit: upper,
            lowerLimit: lower,
            difference: diff,
            message: `Left Flank Tooth ${t} ${row.label} of ${val} µm is below lower limit of ${lower} µm (-${diff} µm)`,
          });
        }
      }
    }

    // Check Right Side
    for (const t of teeth) {
      const val = row.right.teeth[t];
      if (val === null || val === undefined) {
        missing_measurements.push(`Right flank ${row.label} tooth ${t} is missing`);
      } else {
        let upper = row.right.tol_upper;
        let lower = row.right.tol_lower;

        if (userTolerance) {
          if (row.name === 'ffp') upper = userTolerance.ffp_upper;
          if (row.name === 'fHbeta') {
            upper = userTolerance.fHbeta_upper;
            lower = userTolerance.fHbeta_lower;
          }
        }

        if (upper !== null && val > upper) {
          const diff = Math.round((val - upper) * 10) / 10;
          violations.push({
            rowName: row.name,
            rowLabel: row.label,
            side: 'right',
            tooth: t,
            value: val,
            upperLimit: upper,
            lowerLimit: lower,
            difference: diff,
            message: `Right Flank Tooth ${t} ${row.label} of ${val} µm exceeds upper limit of ${upper} µm (+${diff} µm)`,
          });
        }

        if (lower !== null && val < lower) {
          const diff = Math.round((lower - val) * 10) / 10;
          violations.push({
            rowName: row.name,
            rowLabel: row.label,
            side: 'right',
            tooth: t,
            value: val,
            upperLimit: upper,
            lowerLimit: lower,
            difference: diff,
            message: `Right Flank Tooth ${t} ${row.label} of ${val} µm is below lower limit of ${lower} µm (-${diff} µm)`,
          });
        }
      }
    }
  }

  // Determine calculated_status
  let calculated_status: InspectionStatus = 'OK';
  let status_explanation = '';

  if (missing_measurements.length > 4) {
    calculated_status = 'INCOMPLETE';
    status_explanation = `Report is marked INCOMPLETE due to ${missing_measurements.length} missing measurement values.`;
  } else if (violations.length > 0) {
    calculated_status = 'NOT_OK';
    status_explanation = `Report evaluated as NOT_OK: ${violations.length} measurements violate the specified tolerance limits.`;
  } else {
    // Check if tolerances were actually present
    const hasTolerances = table.rows.some(
      (r) =>
        r.left.tol_upper !== null ||
        r.left.tol_lower !== null ||
        r.right.tol_upper !== null
    );

    if (!hasTolerances && !userTolerance) {
      calculated_status = 'REVIEW_REQUIRED';
      status_explanation =
        'No explicit tolerance limits found in the report; manual review required to verify compliance.';
    } else {
      calculated_status = 'OK';
      status_explanation =
        'All extracted lead measurements comply with defined upper and lower tolerance limits.';
    }
  }

  // Calculate confidence score (0 - 100)
  let confidence = 95;
  if (missing_measurements.length > 0) {
    confidence -= Math.min(40, missing_measurements.length * 5);
  }
  if (!original_status || original_status === 'UNKNOWN') {
    confidence -= 10;
    warnings.push('Original ZEISS inspection status stamp was not detected');
  }

  return {
    original_status,
    calculated_status,
    status_explanation,
    violations,
    missing_measurements,
    confidence_score: Math.max(10, Math.min(100, confidence)),
    warnings,
  };
}

