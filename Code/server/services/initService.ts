import { processPDFs, type PDFChunk } from "./pdfProcessor";
import { initializeEmbeddings, type EmbeddingData } from "./embeddingsService";

let pdfChunks: PDFChunk[] = [];
let embeddings: EmbeddingData[] = [];
let isInitialized = false;

/**
 * Initialize the document processing system
 * This processes PDFs and generates/loads embeddings
 */
export async function initializeDocumentSystem(): Promise<void> {
  if (isInitialized) {
    console.log("[Init Service] Already initialized");
    return;
  }

  console.log("[Init Service] Starting document system initialization...");

  try {
    // Step 1: Process PDFs
    console.log("[Init Service] Processing PDF documents...");
    pdfChunks = await processPDFs("data");
    
    if (pdfChunks.length === 0) {
      console.log("[Init Service] No PDF chunks found. Please add legal documents to the data/ folder.");
    }

    // Step 2: Initialize embeddings (load from cache or generate)
    console.log("[Init Service] Initializing embeddings...");
    embeddings = await initializeEmbeddings(pdfChunks);

    isInitialized = true;
    console.log("[Init Service] Document system initialization complete!");
    console.log(`[Init Service] Ready with ${pdfChunks.length} chunks and ${embeddings.length} embeddings`);
  } catch (error) {
    console.error("[Init Service] Error during initialization:", error);
    // Don't throw - allow server to start even if initialization fails
    console.log("[Init Service] Server will start without document processing capabilities");
  }
}

/**
 * Get the current PDF chunks
 */
export function getPDFChunks(): PDFChunk[] {
  return pdfChunks;
}

/**
 * Get the current embeddings
 */
export function getEmbeddings(): EmbeddingData[] {
  return embeddings;
}

/**
 * Check if the system is initialized
 */
export function getInitializationStatus(): boolean {
  return isInitialized;
}
