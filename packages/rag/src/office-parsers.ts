import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate';
import type { SourcePage } from './index.ts';
import { normalizeText } from './index.ts';

/**
 * Extracts plain text from XML by extracting text nodes inside specific tag patterns.
 */
function extractXmlTags(xml: string, tagNames: string[]): string[] {
  const texts: string[] = [];
  const tagPattern = new RegExp(`<(${tagNames.join('|')})[^>]*>(.*?)</\\1>`, 'gis');
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(xml)) !== null) {
    const rawContent = match[2] ?? '';
    // Strip nested XML tags and decode common XML entities
    const decoded = rawContent
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    if (decoded) {
      texts.push(decoded);
    }
  }

  return texts;
}

/**
 * Parses a Microsoft Word DOCX file into page-delimited SourcePage chunks.
 * Inspects `word/document.xml`, preserves paragraph structure, and respects page breaks.
 */
export function parseDocxDocument(data: ArrayBuffer | Uint8Array): SourcePage[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let unzipped: Record<string, Uint8Array>;

  try {
    unzipped = unzipSync(bytes);
  } catch (err) {
    throw new Error(`Failed to read DOCX file as a zip archive: ${err instanceof Error ? err.message : String(err)}`);
  }

  const documentXmlBytes = unzipped['word/document.xml'];
  if (!documentXmlBytes) {
    throw new Error('Invalid DOCX format: missing word/document.xml');
  }

  const documentXml = strFromU8(documentXmlBytes);

  // Split by explicit page breaks if present
  const hasPageBreaks = /<w:br[^>]+w:type="page"|<w:lastRenderedPageBreak/i.test(documentXml);
  const rawParagraphs: string[] = [];

  // Match each <w:p> paragraph
  const pRegex = /<w:p(?:\s[^>]*)?>(.*?)<\/w:p>/gis;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(documentXml)) !== null) {
    const pContent = pMatch[1] ?? '';
    const runTexts = extractXmlTags(pContent, ['w:t']);
    const paragraphText = runTexts.join('').trim();
    const isPageBreak = /<w:br[^>]+w:type="page"|<w:lastRenderedPageBreak/i.test(pContent);

    if (paragraphText) {
      rawParagraphs.push(paragraphText);
    }
    if (isPageBreak && rawParagraphs.length > 0) {
      rawParagraphs.push('__PAGE_BREAK__');
    }
  }

  if (rawParagraphs.length === 0) {
    // Fallback: extract all w:t runs
    const allTexts = extractXmlTags(documentXml, ['w:t']);
    const fullText = normalizeText(allTexts.join(' '));
    return fullText ? [{ page: 1, text: fullText }] : [];
  }

  // Partition paragraphs into pages
  const pages: SourcePage[] = [];
  let currentPageText: string[] = [];
  let currentPageWords = 0;
  const WORDS_PER_SYNTHETIC_PAGE = 350;

  for (const para of rawParagraphs) {
    if (para === '__PAGE_BREAK__') {
      if (currentPageText.length > 0) {
        pages.push({
          page: pages.length + 1,
          text: normalizeText(currentPageText.join('\n\n')),
        });
        currentPageText = [];
        currentPageWords = 0;
      }
      continue;
    }

    currentPageText.push(para);
    const words = para.split(/\s+/).filter(Boolean).length;
    currentPageWords += words;

    // If no explicit page breaks, paginate by word count threshold
    if (!hasPageBreaks && currentPageWords >= WORDS_PER_SYNTHETIC_PAGE) {
      pages.push({
        page: pages.length + 1,
        text: normalizeText(currentPageText.join('\n\n')),
      });
      currentPageText = [];
      currentPageWords = 0;
    }
  }

  if (currentPageText.length > 0) {
    pages.push({
      page: pages.length + 1,
      text: normalizeText(currentPageText.join('\n\n')),
    });
  }

  return pages;
}

/**
 * Parses a Microsoft PowerPoint PPTX presentation into slide-delimited SourcePage chunks.
 * Natural-sorts `ppt/slides/slide{N}.xml` and maps each slide to Page N.
 */
export function parsePptxDocument(data: ArrayBuffer | Uint8Array): SourcePage[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let unzipped: Record<string, Uint8Array>;

  try {
    unzipped = unzipSync(bytes);
  } catch (err) {
    throw new Error(`Failed to read PPTX file as a zip archive: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Find slide files
  const slidePaths = Object.keys(unzipped).filter((path) =>
    path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
  );

  if (slidePaths.length === 0) {
    throw new Error('Invalid PPTX format: no slides found in ppt/slides/');
  }

  // Natural numeric sort: slide1.xml, slide2.xml, ..., slide10.xml
  slidePaths.sort((a, b) => {
    const numA = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
    return numA - numB;
  });

  const pages: SourcePage[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i]!;
    const slideXml = strFromU8(unzipped[slidePath]!);

    // Extract text runs inside <a:p> paragraphs or <a:t> text nodes
    const pRegex = /<a:p(?:\s[^>]*)?>(.*?)<\/a:p>/gis;
    const slideParagraphs: string[] = [];
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(slideXml)) !== null) {
      const pContent = pMatch[1] ?? '';
      const tRuns = extractXmlTags(pContent, ['a:t']);
      const paragraphText = tRuns.join('').trim();
      if (paragraphText) {
        slideParagraphs.push(paragraphText);
      }
    }

    // Fallback: extract all a:t
    if (slideParagraphs.length === 0) {
      const allText = extractXmlTags(slideXml, ['a:t']).join(' ').trim();
      if (allText) {
        slideParagraphs.push(allText);
      }
    }

    const slideText = normalizeText(slideParagraphs.join('\n\n'));
    if (slideText) {
      pages.push({
        page: i + 1,
        text: slideText,
      });
    }
  }

  return pages;
}

/**
 * Universal office document parser supporting DOCX, PPTX, and TXT files.
 */
export function parseOfficeDocument(
  filename: string,
  data: ArrayBuffer | Uint8Array,
): SourcePage[] {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return parseDocxDocument(data);
  }

  if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
    return parsePptxDocument(data);
  }

  if (lower.endsWith('.txt') || lower.endsWith('.text') || lower.endsWith('.md')) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const text = normalizeText(new TextDecoder().decode(bytes));
    return text ? [{ page: 1, text }] : [];
  }

  throw new Error(`Unsupported document extension for ${filename}. Supported formats are PDF, DOCX, PPTX, and TXT.`);
}

/**
 * Creates an in-memory sample DOCX file for testing and verification without external fixtures.
 */
export function createSampleDocx(paragraphs: string[][]): Uint8Array {
  let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n<w:body>\n`;

  for (let i = 0; i < paragraphs.length; i++) {
    const pageParas = paragraphs[i]!;
    for (const p of pageParas) {
      docXml += `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>\n`;
    }
    if (i < paragraphs.length - 1) {
      docXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n`;
    }
  }

  docXml += `</w:body></w:document>`;

  const files: Record<string, Uint8Array> = {
    'word/document.xml': strToU8(docXml),
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`),
  };

  return zipSync(files);
}

/**
 * Creates an in-memory sample PPTX file with multiple slides for testing and verification.
 */
export function createSamplePptx(slides: string[][]): Uint8Array {
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>`),
  };

  for (let i = 0; i < slides.length; i++) {
    const slideIndex = i + 1;
    const slideParas = slides[i]!;
    let slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n<p:cSld><p:spTree>\n`;

    for (const text of slideParas) {
      slideXml += `<p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>\n`;
    }

    slideXml += `</p:spTree></p:cSld></p:sld>`;
    files[`ppt/slides/slide${slideIndex}.xml`] = strToU8(slideXml);
  }

  return zipSync(files);
}
