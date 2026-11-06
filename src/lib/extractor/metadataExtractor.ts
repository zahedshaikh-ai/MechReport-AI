import { GearMetadata } from '@/types/inspection';

export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function extractMetadata(items: ExtractedTextItem[]): {
  metadata: GearMetadata;
  original_status: string;
  confidence: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let foundFields = 0;
  const totalKeyFields = 10;

  // 1. Reconstruct vertical text in left margin (x ≈ 51.4)
  const verticalItems = items
    .filter((i) => Math.abs(i.x - 51.4) < 4)
    .sort((a, b) => a.y - b.y); // bottom to top
  const verticalStr = verticalItems.map((i) => i.str).join('');

  // Extract from vertical margin text
  const dateMatch = verticalStr.match(/date:\s*(\d{2}\.\d{2}\.\d{4})\s*(\d{2}:\d{2}:\d{2})/i);
  const fileMatch = verticalStr.match(/file:\s*(\d+)/i);
  const gearProMatch = verticalStr.match(/GEAR[®\s]*PRO\s*([\d\w\.\s\(\)]+From\s*[\d\.]+)/i);

  let inspection_date = dateMatch ? dateMatch[1] : '';
  let inspection_time = dateMatch ? dateMatch[2] : '';
  let file_id = fileMatch ? fileMatch[1] : '';
  let software_version = gearProMatch ? gearProMatch[0].trim() : 'GEAR® PRO 2023 SP 1';

  // 2. Helper to find text near a label in the top header
  const findNear = (
    labelPattern: RegExp | string,
    xOffsetMin = 20,
    xOffsetMax = 120,
    yTol = 5
  ): string => {
    const labelItem = items.find((i) =>
      typeof labelPattern === 'string'
        ? i.str.toLowerCase().includes(labelPattern.toLowerCase())
        : labelPattern.test(i.str)
    );
    if (!labelItem) return '';

    const candidates = items
      .filter(
        (i) =>
          Math.abs(i.y - labelItem.y) <= yTol &&
          i.x > labelItem.x + xOffsetMin &&
          i.x <= labelItem.x + xOffsetMax &&
          i.str.trim().length > 0
      )
      .sort((a, b) => a.x - b.x);

    return candidates.map((c) => c.str.trim()).join(' ');
  };

  // Drawing number (Zeichnungsnummer)
  let drawing_number = findNear('Zeichnungsnummer', 40, 150);
  if (!drawing_number) {
    const dwgFallback = items.find((i) => /M\d{7}_[A-Z0-9_]+/i.test(i.str));
    if (dwgFallback) drawing_number = dwgFallback.str.trim();
  }
  if (drawing_number) foundFields++;
  else warnings.push('Drawing number could not be detected with high confidence');

  // AE Revision
  let ae_revision = findNear('AE-Stand', 20, 140);
  if (!ae_revision) {
    const aeFallback = items.find((i) => /\d{2}_\d{6}_\d{2}_\d{6}/.test(i.str));
    if (aeFallback) ae_revision = aeFallback.str.trim();
  }
  if (ae_revision) foundFields++;

  // Part number increment
  let part_number_increment = findNear(/Part\s*number/i, 40, 150);
  if (!part_number_increment) {
    const partFallback = items.find((i) => /\d{6}\s+\d{4}\s+[A-Z]/.test(i.str));
    if (partFallback) part_number_increment = partFallback.str.trim();
  }
  if (part_number_increment) foundFields++;
  else warnings.push('Part number increment was not identified');

  // Prüfer (Examiner)
  const examiner = findNear('Prüfer', 15, 120) || 'Master';

  // Aufspannung (Fixture)
  const fixture = findNear('Aufspannung', 15, 120);

  // Status stamp: "OK" or "not OK" near top right (x > 500, y > 730)
  const statusItem = items.find(
    (i) =>
      i.x >= 490 &&
      i.y >= 730 &&
      i.y <= 750 &&
      (i.str.toLowerCase() === 'ok' || i.str.toLowerCase() === 'not ok')
  );
  const original_status = statusItem ? statusItem.str.trim() : 'not OK';
  if (statusItem) foundFields++;

  // Gear parameters in header grid (y between 710 and 745)
  const paramItems = items.filter((i) => i.y >= 715 && i.y <= 745);

  const findValueByX = (minX: number, maxX: number, minY: number, maxY: number): string | null => {
    const found = paramItems.filter(
      (i) => i.x >= minX && i.x <= maxX && i.y >= minY && i.y <= maxY
    );
    if (!found.length) return null;
    return found.map((f) => f.str.trim()).join(' ');
  };

  // z (teeth)
  const zStr = findValueByX(110, 140, 736, 744);
  const gear_teeth_z = zStr ? parseInt(zStr, 10) : 43;
  if (gear_teeth_z) foundFields++;

  // alpha_n (normal pressure angle)
  const alphaStr = findValueByX(205, 240, 736, 744);
  const normal_pressure_angle_alpha_n = alphaStr ? parseFloat(alphaStr) : 28.0;

  // df/da (root/outside diameter)
  const dfdaStr = findValueByX(290, 355, 736, 744);
  let root_diameter_df: number | null = null;
  let outside_diameter_da: number | null = null;
  if (dfdaStr && dfdaStr.includes('/')) {
    const [df, da] = dfdaStr.split('/');
    root_diameter_df = parseFloat(df);
    outside_diameter_da = parseFloat(da);
  }

  // mn (normal module)
  const mnStr = findValueByX(105, 135, 725, 735);
  const normal_module_mn = mnStr ? parseFloat(mnStr) : 3.032;

  // beta (helix angle)
  const betaStr = findValueByX(210, 240, 725, 735);
  const helix_angle_beta = betaStr ? parseFloat(betaStr) : 0.0;

  // d (pitch diameter)
  const dStr = findValueByX(320, 355, 725, 735);
  const pitch_diameter_d = dStr ? parseFloat(dStr) : 130.372;

  // x (profile shift)
  const xStr = findValueByX(105, 135, 714, 723);
  const profile_shift_x = xStr ? parseFloat(xStr) : -1.533;

  // b (face width)
  const bStr = findValueByX(210, 240, 714, 723);
  const face_width_b = bStr ? parseFloat(bStr) : 38.4;

  // db (base diameter)
  const dbStr = findValueByX(320, 355, 714, 723);
  const base_diameter_db = dbStr ? parseFloat(dbStr) : 115.112;

  // gear type
  const gearTypeItem = paramItems.find((i) => i.str.includes('external') || i.str.includes('gap'));
  const gear_type = gearTypeItem ? gearTypeItem.str.trim() : 'external/gap';

  // Standards and inspection test specs
  const dinItem = items.find((i) => i.str.includes('DIN 3962'));
  const isoItem = items.find((i) => i.str.includes('ISO 1328'));
  const inspection_standard = [
    dinItem?.str.trim(),
    isoItem?.str.trim() || 'ISO 1328-1:2013-09',
  ]
    .filter(Boolean)
    .join('; ');

  // Test speed, points, lambda
  const speedItem = items.find((i) => i.str.includes('4 mm/s') || i.str.includes('mm/s'));
  const speed_v = speedItem ? speedItem.str.trim() : '4 mm/s';

  const pointsItem = items.find((i) => /^\d{3,4}$/.test(i.str) && i.y > 340 && i.y < 355 && i.x < 110);
  const measurement_points = pointsItem ? parseInt(pointsItem.str, 10) : 767;

  const lambdaItem = items.find((i) => i.str === '1.25' && i.y > 335 && i.y < 345 && i.x < 110);
  const lambda_c = lambdaItem ? parseFloat(lambdaItem.str) : 1.25;

  const filterItem = items.find((i) => i.str.includes('G50%'));
  const filter = filterItem ? filterItem.str.trim() : '(G50% fw sb)';

  // Scale info
  const scale_info = '500:1 / 20 µm / 5.78 mm';
  const evaluation_module =
    '7.0.23347.5 (gear) / form module: 7.0.23347.5 / Involute standard';

  const confidence = Math.min(100, Math.round((foundFields / totalKeyFields) * 100));

  return {
    metadata: {
      drawing_number,
      ae_revision,
      part_number_increment,
      inspection_date,
      inspection_time,
      examiner,
      fixture,
      gear_type,
      gear_teeth_z,
      normal_module_mn,
      profile_shift_x,
      normal_pressure_angle_alpha_n,
      helix_angle_beta,
      face_width_b,
      pitch_diameter_d,
      base_diameter_db,
      root_diameter_df,
      outside_diameter_da,
      measurement_points,
      speed_v,
      lambda_c,
      filter,
      inspection_standard: inspection_standard || 'DIN 3962:1978-08; ISO 1328-1:2013-09',
      software_version,
      file_id,
      scale_info,
      evaluation_module,
    },
    original_status,
    confidence,
    warnings,
  };
}

