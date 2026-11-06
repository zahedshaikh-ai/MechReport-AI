import { createWorker } from 'tesseract.js';
import { ExtractedTextItem } from './metadataExtractor';

export async function runOcrOnCanvas(
  canvas: HTMLCanvasElement
): Promise<ExtractedTextItem[]> {
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(canvas);
    await worker.terminate();

    const items: ExtractedTextItem[] = [];
    if (ret.data && ret.data.words) {
      for (const w of ret.data.words) {
        if (w.text.trim()) {
          // Invert y to match PDF coordinate space (0 at bottom)
          const pdfY = canvas.height - w.bbox.y1;
          items.push({
            str: w.text.trim(),
            x: w.bbox.x0,
            y: pdfY,
            w: w.bbox.x1 - w.bbox.x0,
            h: w.bbox.y1 - w.bbox.y0,
          });
        }
      }
    }
    return items;
  } catch (err) {
    console.warn('OCR processing failed or not supported in this runtime:', err);
    return [];
  }
}

