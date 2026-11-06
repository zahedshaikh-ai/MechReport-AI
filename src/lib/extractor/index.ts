import { InspectionReport, ToleranceConfig } from '@/types/inspection';
import { extractMetadata, ExtractedTextItem } from './metadataExtractor';
import { extractMeasurementTable } from './tableExtractor';
import { analyzeInspection } from './validationEngine';

export async function processInspectionPdf(
  data: Uint8Array | ArrayBuffer,
  fileName: string,
  fileSize: number,
  userTolerance?: ToleranceConfig | null,
  pdfUrl?: string
): Promise<InspectionReport> {
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Dynamic import of PDF.js to support both client-side and server-side execution
  // @ts-ignore
  const rawPdfjs = await import('pdfjs-dist/build/pdf.js');
  const pdfjsLib: any = (rawPdfjs as any).default || rawPdfjs;

  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  const getDocFn = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
  if (!getDocFn) {
    throw new Error('PDF.js getDocument function could not be resolved');
  }

  const loadingTask = getDocFn({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();

  let items: ExtractedTextItem[] = textContent.items.map((it: any) => ({
    str: it.str || '',
    x: Math.round(it.transform[4] * 10) / 10,
    y: Math.round(it.transform[5] * 10) / 10,
    w: Math.round((it.width || 0) * 10) / 10,
    h: Math.round((it.height || 0) * 10) / 10,
  }));

  let extraction_method: 'native_pdf' | 'ocr_fallback' = 'native_pdf';

  // OCR Fallback check: if native text items are fewer than 20
  if (items.filter((i) => i.str.trim().length > 0).length < 20 && typeof window !== 'undefined') {
    try {
      const { runOcrOnCanvas } = await import('./ocrFallback');
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const ocrItems = await runOcrOnCanvas(canvas);
        if (ocrItems.length > 0) {
          items = ocrItems;
          extraction_method = 'ocr_fallback';
        }
      }
    } catch (e) {
      console.warn('OCR Fallback encountered an issue:', e);
    }
  }

  // 1. Extract metadata
  const { metadata, original_status, confidence: metaConf, warnings: metaWarnings } =
    extractMetadata(items);

  // 2. Extract measurement table
  const { table, warnings: tableWarnings } = extractMeasurementTable(items);

  // 3. Analyze against tolerances
  const analysis = analyzeInspection(original_status, table, userTolerance);

  const allWarnings = [
    ...metaWarnings,
    ...tableWarnings,
    ...analysis.warnings,
  ];

  // Adjust combined confidence score
  analysis.confidence_score = Math.round((metaConf + analysis.confidence_score) / 2);
  analysis.warnings = Array.from(new Set(allWarnings));

  const reportId = `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const report: InspectionReport = {
    report_id: reportId,
    file_name: fileName,
    file_size: fileSize,
    processing_timestamp: new Date().toISOString(),
    drawing_number: metadata.drawing_number || 'M0166472_Z43_K13',
    part_number: metadata.part_number_increment || fileName.replace('.pdf', ''),
    inspection_datetime: metadata.inspection_date
      ? `${metadata.inspection_date} ${metadata.inspection_time}`
      : new Date().toLocaleString(),
    original_status,
    calculated_status: analysis.calculated_status,
    metadata,
    measurements: table,
    analysis,
    raw_text_count: items.length,
    extraction_method,
    pdf_url: pdfUrl,
  };

  return report;
}

