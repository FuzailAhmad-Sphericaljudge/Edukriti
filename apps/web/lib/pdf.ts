import { extractText, getDocumentProxy } from 'unpdf';

const MAX_PAGES = 80;
const EXTRACTION_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PDF extraction timed out.')), milliseconds);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function extractPdfPages(bytes: ArrayBuffer) {
  const pdf = await withTimeout(getDocumentProxy(new Uint8Array(bytes)), EXTRACTION_TIMEOUT_MS);
  if (pdf.numPages > MAX_PAGES) throw new Error(`PDF exceeds the ${MAX_PAGES}-page prototype limit.`);
  const result = await withTimeout(extractText(pdf, { mergePages: false }), EXTRACTION_TIMEOUT_MS);
  const pages = Array.isArray(result.text) ? result.text : [result.text];
  return pages.map((text, index) => ({ page: index + 1, text }));
}
