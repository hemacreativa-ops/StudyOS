import { PDFDocument } from 'pdf-lib';

export interface PdfChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  startPage: number;
  endPage: number;
  totalPages: number;
  pdfBase64: string;
}

/**
 * Reads a PDF file, returns page count and information about the document
 */
export async function getPdfMetadata(file: File): Promise<{ pageCount: number; sizeMB: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const sizeMB = file.size / (1024 * 1024);
  return { pageCount, sizeMB };
}

/**
 * Splits a PDF document into smaller page chunks if needed.
 * Returns an array of base64 PDF chunk strings.
 */
export async function splitPdfIntoChunks(
  file: File,
  pagesPerChunk: number = 6
): Promise<PdfChunkInfo[]> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('El archivo PDF parece estar vacío o no contiene páginas válidas.');
  }

  const chunks: PdfChunkInfo[] = [];
  const totalChunks = Math.ceil(totalPages / pagesPerChunk);

  for (let i = 0; i < totalChunks; i++) {
    const startPage = i * pagesPerChunk;
    const endPage = Math.min((i + 1) * pagesPerChunk, totalPages);

    const chunkPdf = await PDFDocument.create();
    const pageIndices = Array.from({ length: endPage - startPage }, (_, index) => startPage + index);
    const copiedPages = await chunkPdf.copyPages(sourcePdf, pageIndices);
    
    copiedPages.forEach((page) => chunkPdf.addPage(page));

    const chunkBase64 = await chunkPdf.saveAsBase64({ dataUri: true });

    chunks.push({
      chunkIndex: i + 1,
      totalChunks,
      startPage: startPage + 1,
      endPage,
      totalPages,
      pdfBase64: chunkBase64,
    });
  }

  return chunks;
}
