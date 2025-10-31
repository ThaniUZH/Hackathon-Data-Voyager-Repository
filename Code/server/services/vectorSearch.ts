import OpenAI from "openai";
import type { EmbeddingData } from "./embeddingsService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";

export interface SearchResult {
  chunkId: string;
  filename: string;
  country: string;
  pageNumber: number;
  text: string;
  similarity: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate embedding for a query string
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("[Vector Search] Error generating query embedding:", error);
    throw error;
  }
}

/**
 * Search for similar documents using vector similarity
 */
export async function searchSimilarDocuments(
  query: string,
  embeddings: EmbeddingData[],
  topK: number = 5,
  minSimilarity: number = 0.7
): Promise<SearchResult[]> {
  console.log(`[Vector Search] Searching for: "${query}"`);

  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);

  // Calculate similarity scores
  const results: SearchResult[] = embeddings.map((embData) => ({
    chunkId: embData.chunkId,
    filename: embData.filename,
    country: embData.country,
    pageNumber: embData.pageNumber,
    text: embData.text,
    similarity: cosineSimilarity(queryEmbedding, embData.embedding),
  }));

  // Filter by minimum similarity and sort by score (descending)
  const filteredResults = results
    .filter((r) => r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  console.log(
    `[Vector Search] Found ${filteredResults.length} results above similarity threshold ${minSimilarity}`
  );

  return filteredResults;
}

/**
 * Search for documents by country filter
 */
export async function searchByCountry(
  query: string,
  embeddings: EmbeddingData[],
  country: string,
  topK: number = 5
): Promise<SearchResult[]> {
  console.log(`[Vector Search] Searching in ${country} for: "${query}"`);

  // Filter embeddings by country first
  const countryEmbeddings = embeddings.filter(
    (e) => e.country.toLowerCase() === country.toLowerCase()
  );

  if (countryEmbeddings.length === 0) {
    console.log(`[Vector Search] No documents found for country: ${country}`);
    return [];
  }

  // Search within filtered embeddings
  return searchSimilarDocuments(query, countryEmbeddings, topK, 0.6);
}

/**
 * Get context for RAG - retrieves relevant documents and formats them
 */
export async function getRAGContext(
  query: string,
  embeddings: EmbeddingData[],
  maxChunks: number = 10
): Promise<string> {
  const results = await searchSimilarDocuments(query, embeddings, maxChunks, 0.65);

  if (results.length === 0) {
    return "No relevant legal documents found.";
  }

  // Format results as context for the LLM
  const context = results
    .map((result, index) => {
      return `[Document ${index + 1}: ${result.filename}, Page ${result.pageNumber}, Similarity: ${(result.similarity * 100).toFixed(1)}%]
${result.text}

---`;
    })
    .join("\n\n");

  return context;
}
