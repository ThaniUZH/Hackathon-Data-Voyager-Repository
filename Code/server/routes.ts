import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { transcribeAudio, extractEntities, generateCaseNumber, searchWebForSimilarCases } from "./services/aiService";
import { initializeDocumentSystem, getEmbeddings } from "./services/initService";
import { getRAGContext, searchSimilarDocuments } from "./services/vectorSearch";
import OpenAI from "openai";
import path from "path";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize document processing system on server startup
  console.log("[Routes] Initializing document processing system...");
  initializeDocumentSystem().catch(error => {
    console.error("[Routes] Initialization error:", error);
  });

  // POST /api/intake/analyze - Analyze case notes and extract entities
  app.post("/api/intake/analyze", upload.single("audio"), async (req, res) => {
    try {
      console.log("[/api/intake/analyze] Processing intake request");

      let notes = req.body.notes || "";
      let audioTranscription: string | undefined;

      // If audio file is provided, transcribe it
      if (req.file) {
        console.log("[/api/intake/analyze] Audio file received, transcribing...");
        const transcription = await transcribeAudio(req.file.buffer, req.file.originalname);
        audioTranscription = transcription;
        
        // Use transcription as notes if no notes provided
        if (!notes) {
          notes = transcription;
        } else {
          notes = notes + "\n\nAudio transcription:\n" + transcription;
        }
      }

      if (!notes || notes.trim().length === 0) {
        return res.status(400).json({ 
          error: "No notes or audio provided" 
        });
      }

      // Extract entities using GPT-4
      const extractedEntities = await extractEntities(notes);

      // Create case number
      const caseNumber = generateCaseNumber();

      // Create new case
      const newCase = await storage.createCase({
        caseNumber,
        notes,
        audioTranscription,
        extractedEntities,
        status: "draft",
      });

      console.log("[/api/intake/analyze] Case created:", newCase.caseNumber);

      return res.json({
        success: true,
        case: newCase,
      });
    } catch (error) {
      console.error("[/api/intake/analyze] Error:", error);
      return res.status(500).json({ 
        error: "Failed to process intake",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/chat - Chat with AI assistant using RAG
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, caseId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log("[/api/chat] Processing chat message:", message.substring(0, 50) + "...");

      // Get embeddings for RAG (optional - will use general knowledge if not available)
      const embeddings = getEmbeddings();
      const hasDocuments = embeddings.length > 0;

      if (!hasDocuments) {
        console.log("[/api/chat] No legal documents available - using GPT-4's general knowledge");
      }

      // Get context from legal documents if available
      const context = hasDocuments 
        ? await getRAGContext(message, embeddings, 8)
        : "No specific legal documents available. Please provide general legal guidance based on your knowledge of refugee and asylum law.";

      // If caseId provided, get case details for context
      let caseContext = "";
      if (caseId) {
        const caseData = await storage.getCase(caseId);
        if (caseData) {
          caseContext = `\n\nCurrent Case Context:\nCase Number: ${caseData.caseNumber}\nHost Country: ${caseData.extractedEntities.hostCountry || "Unknown"}\nMedical Needs: ${caseData.extractedEntities.medicalNeeds?.join(", ") || "None specified"}\nEducation Needs: ${caseData.extractedEntities.educationNeeds?.join(", ") || "None specified"}`;
        }
      }

      // Create expert system prompt
      const systemPrompt = `You are an expert legal assistant for UNHCR helping lawyers with refugee asylum cases.

You have access to a comprehensive database of legal documents from Switzerland and other countries.

Your responsibilities:
- Provide accurate legal information based on the provided documents
- Cite specific laws, articles, and precedents when answering
- Be clear about what the law says vs. what might be open to interpretation
- Acknowledge when you don't have enough information
- Use professional, clear language

When answering:
1. Always cite your sources (document name, article, page number)
2. Be specific and practical
3. Highlight both rights and potential complications
4. Suggest next steps when appropriate

${caseContext}

Relevant Legal Documents:
${context}`;

      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: "Failed to process chat message",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // POST /api/report/generate - Generate comprehensive legal report
  app.post("/api/report/generate", async (req, res) => {
    try {
      const { caseId } = req.body;

      if (!caseId) {
        return res.status(400).json({ error: "Case ID is required" });
      }

      console.log("[/api/report/generate] Generating report for case:", caseId);

      // Get case data
      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Get embeddings for vector search (optional - will use GPT-4's knowledge if not available)
      const embeddings = getEmbeddings();
      const hasDocuments = embeddings.length > 0;

      if (!hasDocuments) {
        console.log("[/api/report/generate] No legal documents available - using GPT-4's general knowledge");
      }

      // Analyze different rights categories
      const rightsCategories = [];
      
      // Health/Medical Rights
      if (caseData.extractedEntities.medicalNeeds && caseData.extractedEntities.medicalNeeds.length > 0) {
        rightsCategories.push({
          type: "health" as const,
          query: `medical rights healthcare access treatment for ${caseData.extractedEntities.medicalNeeds.join(" ")} in ${caseData.extractedEntities.hostCountry || "Switzerland"}`,
        });
      }

      // Education Rights
      if (caseData.extractedEntities.educationNeeds && caseData.extractedEntities.educationNeeds.length > 0) {
        rightsCategories.push({
          type: "education" as const,
          query: `education rights school access language classes for refugees in ${caseData.extractedEntities.hostCountry || "Switzerland"}`,
        });
      }

      // Family Life Rights (if family size mentioned)
      if (caseData.extractedEntities.familySize && caseData.extractedEntities.familySize > 1) {
        rightsCategories.push({
          type: "family_life" as const,
          query: `family reunification rights asylum family members in ${caseData.extractedEntities.hostCountry || "Switzerland"}`,
        });
      }

      // Housing Rights (default for all cases)
      rightsCategories.push({
        type: "housing" as const,
        query: `housing accommodation rights refugees asylum seekers in ${caseData.extractedEntities.hostCountry || "Switzerland"}`,
      });

      // Generate analysis for each rights category
      const rightsAnalysis = await Promise.all(
        rightsCategories.map(async ({ type, query }) => {
          // Search for similar documents if available
          const searchResults = hasDocuments 
            ? await searchSimilarDocuments(query, embeddings, 5, 0.65)
            : [];

          // Format context for GPT-4
          const context = searchResults.length > 0
            ? searchResults
                .map((r, i) => `[Document ${i + 1}: ${r.filename}, Page ${r.pageNumber}]\n${r.text}`)
                .join("\n\n")
            : "No specific legal documents available. Please provide analysis based on general legal knowledge of refugee rights.";

          // Generate analysis using GPT-4
          const analysisPrompt = hasDocuments
            ? `Analyze the following legal documents regarding ${type} rights for a refugee case in ${caseData.extractedEntities.hostCountry || "Switzerland"}.

Case Context:
- Medical needs: ${caseData.extractedEntities.medicalNeeds?.join(", ") || "None"}
- Education needs: ${caseData.extractedEntities.educationNeeds?.join(", ") || "None"}
- Family size: ${caseData.extractedEntities.familySize || "Unknown"}
- Urgency: ${caseData.extractedEntities.urgencyLevel || "Unknown"}

Legal Documents:
${context}

Provide:
1. A clear summary of the rights (2-3 sentences)
2. The legal basis and specific articles from the documents
3. A key citation with exact quote, source, filename, and page number
4. 2-3 potential complications or restrictions
5. 2-3 legal risks to be aware of
6. Overall confidence level: low, medium, or high

Return as JSON with this structure:
{
  "summary": "...",
  "legalBasis": "...",
  "citation": {
    "quote": "...",
    "source": "Article X of Document Y",
    "filename": "...",
    "pageNumber": 1
  },
  "complications": ["...", "..."],
  "risks": ["...", "..."],
  "confidenceLevel": "medium"
}`
            : `Provide a general legal analysis regarding ${type} rights for a refugee case in ${caseData.extractedEntities.hostCountry || "Switzerland"}.

Case Context:
- Medical needs: ${caseData.extractedEntities.medicalNeeds?.join(", ") || "None"}
- Education needs: ${caseData.extractedEntities.educationNeeds?.join(", ") || "None"}
- Family size: ${caseData.extractedEntities.familySize || "Unknown"}
- Urgency: ${caseData.extractedEntities.urgencyLevel || "Unknown"}

NOTE: No specific legal documents are available. Use general knowledge of refugee rights and asylum law.

Provide:
1. A clear summary of the rights (2-3 sentences)
2. The legal basis and relevant international/national frameworks
3. A general citation (use "General Legal Framework" as source with confidence note)
4. 2-3 potential complications or restrictions
5. 2-3 legal risks to be aware of
6. Overall confidence level: LOW (due to lack of specific documents)

Return as JSON with this structure:
{
  "summary": "...",
  "legalBasis": "...",
  "citation": {
    "quote": "General framework note",
    "source": "General Legal Framework (no specific documents available)",
    "filename": null,
    "pageNumber": null
  },
  "complications": ["...", "..."],
  "risks": ["...", "..."],
  "confidenceLevel": "low"
}`;

          const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an expert legal analyst specializing in refugee asylum law." },
              { role: "user", content: analysisPrompt },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          });

          const analysisContent = analysisResponse.choices[0]?.message?.content;
          if (!analysisContent) {
            return null;
          }

          const analysis = JSON.parse(analysisContent);

          // Search web for similar cases using GPT-4 (replaces local PDF search for similar cases)
          const similarCases = await searchWebForSimilarCases({
            rightType: type,
            hostCountry: caseData.extractedEntities.hostCountry || "Switzerland",
            needs: type === "health" 
              ? (caseData.extractedEntities.medicalNeeds || [])
              : type === "education"
              ? (caseData.extractedEntities.educationNeeds || [])
              : [],
            maxResults: 5,
          });

          return {
            rightType: type,
            summary: analysis.summary,
            legalBasis: analysis.legalBasis,
            citation: analysis.citation,
            complications: analysis.complications || [],
            risks: analysis.risks || [],
            similarCases,
            confidenceLevel: analysis.confidenceLevel,
          };
        })
      );

      // Filter out null results
      const validAnalysis = rightsAnalysis.filter((a) => a !== null);

      // Create report
      const report = await storage.createReport({
        caseId: caseData.id,
        caseNumber: caseData.caseNumber,
        generatedAt: new Date().toISOString(),
        rightsAnalysis: validAnalysis,
        disclaimer: "This report is generated by AI analysis of legal documents and should be reviewed by a qualified legal professional. It does not constitute legal advice.",
      });

      // Update case status
      await storage.updateCase(caseData.id, { status: "completed" });

      console.log("[/api/report/generate] Report generated:", report.id);

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("[/api/report/generate] Error:", error);
      return res.status(500).json({ 
        error: "Failed to generate report",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/cases - List all cases
  app.get("/api/cases", async (req, res) => {
    try {
      console.log("[/api/cases] Fetching all cases");
      const cases = await storage.listCases();
      
      // Sort by creation date, newest first
      const sortedCases = cases.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return res.json({
        success: true,
        cases: sortedCases,
      });
    } catch (error) {
      console.error("[/api/cases] Error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch cases",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/report/case/:caseId - Get report for a specific case
  app.get("/api/report/case/:caseId", async (req, res) => {
    try {
      const { caseId } = req.params;
      console.log("[/api/report/case] Fetching report for case:", caseId);
      
      const report = await storage.getReportByCaseId(caseId);
      
      if (!report) {
        return res.status(404).json({ 
          error: "Report not found for this case" 
        });
      }
      
      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("[/api/report/case] Error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch report",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/documents/:filename - Serve PDF files
  app.get("/api/documents/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), "data", filename);

      // Security check - ensure file is in data directory
      const normalizedPath = path.normalize(filePath);
      const dataDir = path.join(process.cwd(), "data");
      
      if (!normalizedPath.startsWith(dataDir)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      // Serve the file
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("[/api/documents] Error:", error);
      return res.status(500).json({ 
        error: "Failed to serve document",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
