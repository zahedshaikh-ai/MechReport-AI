export type InspectionStatus = 'OK' | 'NOT_OK' | 'INCOMPLETE' | 'REVIEW_REQUIRED';

export interface GearMetadata {
  drawing_number: string;
  ae_revision: string;
  part_number_increment: string;
  inspection_date: string;
  inspection_time: string;
  examiner: string;
  fixture: string;
  gear_type: string;
  gear_teeth_z: number | null;
  normal_module_mn: number | null;
  profile_shift_x: number | null;
  normal_pressure_angle_alpha_n: number | null;
  helix_angle_beta: number | null;
  face_width_b: number | null;
  pitch_diameter_d: number | null;
  base_diameter_db: number | null;
  root_diameter_df: number | null;
  outside_diameter_da: number | null;
  measurement_points: number | null;
  speed_v: string | null;
  lambda_c: number | null;
  filter: string | null;
  inspection_standard: string;
  software_version: string;
  file_id: string;
  scale_info: string;
  evaluation_module: string;
}

export interface FlankMeasurement {
  qn: number | null;
  tol_upper: number | null;
  tol_lower: number | null;
  avg: number | null;
  teeth: {
    [tooth: string]: number | null;
  };
  qa: number | null;
  crowning_value?: number | null;
}

export interface MeasurementRow {
  name: 'Fp' | 'ffp' | 'fHbeta' | 'vfHbeta';
  label: string;
  unit: string;
  description: string;
  left: FlankMeasurement;
  right: FlankMeasurement;
}

export interface ExtractedMeasurementTable {
  rows: MeasurementRow[];
  teeth_numbers: string[];
}

export interface OutOfToleranceViolation {
  rowName: string;
  rowLabel: string;
  side: 'left' | 'right';
  tooth?: string;
  isAverage?: boolean;
  value: number;
  upperLimit: number | null;
  lowerLimit: number | null;
  difference: number;
  message: string;
}

export interface InspectionAnalysis {
  original_status: string;
  calculated_status: InspectionStatus;
  status_explanation: string;
  violations: OutOfToleranceViolation[];
  missing_measurements: string[];
  confidence_score: number;
  warnings: string[];
}

export interface InspectionReport {
  report_id: string;
  file_name: string;
  file_size: number;
  processing_timestamp: string;
  drawing_number: string;
  part_number: string;
  inspection_datetime: string;
  original_status: string;
  calculated_status: InspectionStatus;
  metadata: GearMetadata;
  measurements: ExtractedMeasurementTable;
  analysis: InspectionAnalysis;
  raw_text_count?: number;
  extraction_method: 'native_pdf' | 'ocr_fallback';
  pdf_url?: string;
  is_manually_edited?: boolean;
}

export interface ToleranceConfig {
  drawing_number: string;
  ffp_upper: number;
  fHbeta_upper: number;
  fHbeta_lower: number;
  updated_by?: string;
  updated_at?: string;
}

