import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Case Management Schemas (In-Memory Storage)

export const extractedEntitiesSchema = z.object({
  hostCountry: z.string().optional(),
  medicalNeeds: z.array(z.string()).optional(),
  educationNeeds: z.array(z.string()).optional(),
  age: z.number().optional(),
  familySize: z.number().optional(),
  complications: z.array(z.string()).optional(),
  urgencyLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const caseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  notes: z.string(),
  audioTranscription: z.string().optional(),
  extractedEntities: extractedEntitiesSchema,
  status: z.enum(["draft", "verified", "completed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const similarCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  link: z.string(),
  filename: z.string(),
  pageNumber: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  similarity: z.number(),
});

export const rightsAnalysisSchema = z.object({
  rightType: z.enum([
    "asylum",
    "documentation", 
    "education",
    "family_life",
    "freedom_movement",
    "health",
    "housing",
    "liberty_security",
    "nationality",
    "social_protection",
    "work"
  ]),
  summary: z.string(),
  legalBasis: z.string(),
  citation: z.object({
    quote: z.string(),
    source: z.string(),
    filename: z.string(),
    pageNumber: z.number(),
  }),
  complications: z.array(z.string()),
  risks: z.array(z.string()),
  similarCases: z.array(similarCaseSchema),
  confidenceLevel: z.enum(["low", "medium", "high"]),
});

export const reportSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  caseNumber: z.string(),
  generatedAt: z.string(),
  rightsAnalysis: z.array(rightsAnalysisSchema),
  disclaimer: z.string(),
});

// Insert schemas for API endpoints
export const intakeRequestSchema = z.object({
  notes: z.string().optional(),
  audioFile: z.instanceof(Buffer).optional(),
}).refine(
  (data) => data.notes || data.audioFile,
  "Either notes or audioFile must be provided"
);

export const chatMessageSchema = z.object({
  message: z.string().min(1),
  caseId: z.string().optional(),
});

export const generateReportRequestSchema = z.object({
  caseId: z.string(),
});

// Export types
export type ExtractedEntities = z.infer<typeof extractedEntitiesSchema>;
export type Case = z.infer<typeof caseSchema>;
export type SimilarCase = z.infer<typeof similarCaseSchema>;
export type RightsAnalysis = z.infer<typeof rightsAnalysisSchema>;
export type Report = z.infer<typeof reportSchema>;
export type IntakeRequest = z.infer<typeof intakeRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type GenerateReportRequest = z.infer<typeof generateReportRequestSchema>;
