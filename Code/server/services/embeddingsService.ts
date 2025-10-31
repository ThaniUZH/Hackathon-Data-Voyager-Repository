import fs from "fs";
import path from "path";
import OpenAI from "openai";
import type { PDFChunk } from "./pdfProcessor";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingData {
  chunkId: string;
  embedding: number[];
  filename: string;
  country: string;
  pageNumber: number;
  text: string;
}

// Lightweight version for caching (without text to save memory)
interface CachedEmbeddingData {
  chunkId: string;
  embedding: number[];
  filename: string;
  country: string;
  pageNumber: number;
}

interface EmbeddingsCache {
  version: string;
  createdAt: string;
  embeddings: CachedEmbeddingData[];
}

const EMBEDDINGS_CACHE_PATH = path.join(process.cwd(), "data", "embeddings-cache.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100; // Process embeddings in batches

/**
 * Generate embeddings for a batch of text chunks
 */
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error("[Embeddings] Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Generate embeddings for all PDF chunks
 */
export async function generateEmbeddings(chunks: PDFChunk[]): Promise<EmbeddingData[]> {
  console.log(`[Embeddings] Generating embeddings for ${chunks.length} chunks...`);
  
  const embeddingDataList: EmbeddingData[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
    const texts = batch.map(chunk => chunk.text);

    console.log(`[Embeddings] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);

    try {
      const embeddings = await generateEmbeddingsBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        embeddingDataList.push({
          chunkId: batch[j].id,
          embedding: embeddings[j],
          filename: batch[j].filename,
          country: batch[j].country,
          pageNumber: batch[j].pageNumber,
          text: batch[j].text,
        });
      }
    } catch (error) {
      console.error(`[Embeddings] Failed to process batch ${i}-${i + batch.length}:`, error);
      // Continue with next batch
    }
  }

  console.log(`[Embeddings] Successfully generated ${embeddingDataList.length} embeddings`);
  return embeddingDataList;
}

/**
 * Save embeddings to cache file (without text to save memory)
 * Uses streaming to avoid out-of-memory errors with large datasets
 */
export function saveEmbeddingsCache(embeddings: EmbeddingData[]): void {
  try {
    const writeStream = fs.createWriteStream(EMBEDDINGS_CACHE_PATH);
    
    // Write header
    writeStream.write('{"version":"1.0","createdAt":"' + new Date().toISOString() + '","embeddings":[');
    
    // Write each embedding individually to minimize memory usage
    for (let i = 0; i < embeddings.length; i++) {
      const e = embeddings[i];
      
      // Convert to cached format (without text)
      const cached = {
        chunkId: e.chunkId,
        embedding: e.embedding,
        filename: e.filename,
        country: e.country,
        pageNumber: e.pageNumber,
      };
      
      writeStream.write(JSON.stringify(cached));
      
      // Add comma if not last item
      if (i < embeddings.length - 1) {
        writeStream.write(',');
      }
    }
    
    // Write footer
    writeStream.write(']}');
    writeStream.end();
    
    console.log(`[Embeddings] Saved ${embeddings.length} embeddings to cache`);
  } catch (error) {
    console.error("[Embeddings] Error saving cache:", error);
  }
}

/**
 * Load embeddings from cache file and reconstruct with text from chunks
 */
export function loadEmbeddingsCache(chunks: PDFChunk[]): EmbeddingData[] | null {
  try {
    if (!fs.existsSync(EMBEDDINGS_CACHE_PATH)) {
      console.log("[Embeddings] No cache file found");
      return null;
    }

    const cacheData = fs.readFileSync(EMBEDDINGS_CACHE_PATH, "utf-8");
    const cache: EmbeddingsCache = JSON.parse(cacheData);

    // Create a map of chunks by ID for quick lookup
    const chunkMap = new Map(chunks.map(chunk => [chunk.id, chunk]));

    // Reconstruct full EmbeddingData with text from chunks
    const embeddings: EmbeddingData[] = cache.embeddings.map(cached => {
      const chunk = chunkMap.get(cached.chunkId);
      return {
        ...cached,
        text: chunk?.text || "", // Use chunk text or empty string if not found
      };
    });

    console.log(`[Embeddings] Loaded ${cache.embeddings.length} embeddings from cache (created: ${cache.createdAt})`);
    return embeddings;
  } catch (error) {
    console.error("[Embeddings] Error loading cache:", error);
    return null;
  }
}

/**
 * Check if embeddings cache exists and is valid
 */
export function hasCachedEmbeddings(): boolean {
  return fs.existsSync(EMBEDDINGS_CACHE_PATH);
}

/**
 * Initialize embeddings - load from cache or generate new ones
 */
export async function initializeEmbeddings(chunks: PDFChunk[]): Promise<EmbeddingData[]> {
  console.log("[Embeddings] Initializing embeddings system...");

  // Try to load from cache first
  const cached = loadEmbeddingsCache(chunks);
  if (cached && cached.length > 0) {
    console.log("[Embeddings] Using cached embeddings");
    return cached;
  }

  // Generate new embeddings if no cache or empty
  if (chunks.length === 0) {
    console.log("[Embeddings] No chunks to process");
    return [];
  }

  console.log("[Embeddings] No cache found, generating new embeddings...");
  const embeddings = await generateEmbeddings(chunks);
  saveEmbeddingsCache(embeddings);

  return embeddings;
}
