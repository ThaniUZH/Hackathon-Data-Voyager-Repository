import { type User, type InsertUser, type Case, type Report } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Case methods
  createCase(caseData: Omit<Case, "id" | "createdAt" | "updatedAt">): Promise<Case>;
  getCase(id: string): Promise<Case | undefined>;
  getCaseByCaseNumber(caseNumber: string): Promise<Case | undefined>;
  updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined>;
  listCases(): Promise<Case[]>;
  
  // Report methods
  createReport(report: Omit<Report, "id">): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportByCaseId(caseId: string): Promise<Report | undefined>;
  listReports(): Promise<Report[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cases: Map<string, Case>;
  private reports: Map<string, Report>;

  constructor() {
    this.users = new Map();
    this.cases = new Map();
    this.reports = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Case methods
  async createCase(caseData: Omit<Case, "id" | "createdAt" | "updatedAt">): Promise<Case> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newCase: Case = {
      ...caseData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCaseByCaseNumber(caseNumber: string): Promise<Case | undefined> {
    return Array.from(this.cases.values()).find(
      (c) => c.caseNumber === caseNumber,
    );
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined> {
    const existingCase = this.cases.get(id);
    if (!existingCase) {
      return undefined;
    }
    
    const updatedCase: Case = {
      ...existingCase,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };
    
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async listCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Report methods
  async createReport(reportData: Omit<Report, "id">): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...reportData,
      id,
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportByCaseId(caseId: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(
      (r) => r.caseId === caseId,
    );
  }

  async listReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }
}

export const storage = new MemStorage();
