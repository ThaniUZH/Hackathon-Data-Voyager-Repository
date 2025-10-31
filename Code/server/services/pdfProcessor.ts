import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

export interface PDFChunk {
  id: string;
  filename: string;
  filepath: string;
  country: string;
  pageNumber: number;
  text: string;
  chunkIndex: number;
}

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

/**
 * Recursively find all PDF files in a directory
 */
async function findPDFFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`[PDF Processor] Directory not found: ${dir}`);
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await findPDFFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(filepath: string): Promise<{ text: string; numPages: number }> {
  let parser: PDFParse | null = null;
  try {
    const dataBuffer = fs.readFileSync(filepath);
    parser = new PDFParse({ data: dataBuffer });
    
    const result = await parser.getText();
    
    return {
      text: result.text || "",
      numPages: result.total || 0
    };
  } catch (error) {
    console.error(`[PDF Processor] Error extracting text from ${filepath}:`, error);
    return { text: "", numPages: 0 };
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Process all PDFs in the data directory and create chunks
 */
export async function processPDFs(dataDir: string = "data"): Promise<PDFChunk[]> {
  console.log(`[PDF Processor] Starting PDF processing from ${dataDir}...`);
  
  const pdfFiles = await findPDFFiles(dataDir);
  console.log(`[PDF Processor] Found ${pdfFiles.length} PDF files`);

  const allChunks: PDFChunk[] = [];
  let chunkIdCounter = 0;

  for (const filepath of pdfFiles) {
    console.log(`[PDF Processor] Processing: ${filepath}`);
    
    const { text, numPages } = await extractTextFromPDF(filepath);
    
    if (!text || text.trim().length === 0) {
      console.log(`[PDF Processor] Skipping ${filepath} - no text extracted`);
      continue;
    }

    // Extract country from folder structure (e.g., data/switzerland/file.pdf -> switzerland)
    const relativePath = path.relative(dataDir, filepath);
    const pathParts = relativePath.split(path.sep);
    const country = pathParts.length > 1 ? pathParts[0] : "unknown";
    const filename = path.basename(filepath);

    // Split text into chunks
    const textChunks = chunkText(text);
    console.log(`[PDF Processor] Created ${textChunks.length} chunks from ${filename}`);

    // Estimate page number for each chunk (rough approximation)
    const charsPerPage = text.length / numPages;

    for (let i = 0; i < textChunks.length; i++) {
      const charPosition = i * (CHUNK_SIZE - CHUNK_OVERLAP);
      const estimatedPage = Math.max(1, Math.ceil(charPosition / charsPerPage));

      allChunks.push({
        id: `chunk_${chunkIdCounter++}`,
        filename,
        filepath,
        country,
        pageNumber: estimatedPage,
        text: textChunks[i],
        chunkIndex: i
      });
    }
  }

  console.log(`[PDF Processor] Total chunks created: ${allChunks.length}`);
  return allChunks;
}

/**
 * Get a specific chunk by ID
 */
export function getChunkById(chunks: PDFChunk[], id: string): PDFChunk | undefined {
  return chunks.find(chunk => chunk.id === id);
}
