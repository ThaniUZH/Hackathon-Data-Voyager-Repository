# UNHCR Rights-Mapper

## Overview

UNHCR Rights-Mapper is an AI-powered legal assistance tool for pro bono lawyers working with refugee cases. It automates the analysis of unstructured case notes, extracts key information, and generates comprehensive, cited legal reports. The application features a modern chat-based interface that tracks each case as a conversation, aiming for professional clarity and trust. Its core purpose is to eliminate the manual, time-consuming process of sifting through fragmented, multilingual legal documents to determine refugee rights, transforming messy case notes into verified legal briefs.

## Implementation Status

**Production-Ready** ✅ - All core features implemented and tested end-to-end:
- Text and audio case intake with AI entity extraction
- Streaming RAG chat assistant for legal clarification
- Automated legal report generation with confidence scoring
- Works with or without legal document PDFs (graceful degradation)
- Secure file handling with proper validation
- Comprehensive error handling and user feedback

### Recent Fixes & Features (October 31, 2025)
- ✅ **Critical Memory Fix**: Optimized embeddings cache to exclude chunk text content, reducing cache size from ~hundreds MB to ~50MB, preventing out-of-memory errors when processing 56,814 chunks from 488 PDFs
- ✅ **Report Generation Timing**: Removed artificial timeout, loading screen now waits for actual API response completion
- ✅ **Real Data Display**: Report page now uses actual API data for summary, legal basis, complications, and risks instead of hardcoded mock content
- ✅ **Web Search for Similar Cases**: Similar cases section now searches the web using GPT-4 to find relevant legal articles, court decisions, and precedents instead of only searching local PDFs. Returns up to 5 highly relevant cases with clickable external links. Legal basis, complications, and risks still use local PDF analysis.
- ✅ **All 11 Rights Categories**: Reports now display all 11 refugee rights categories (Asylum, Documentation, Education, Family Life, Freedom of Movement, Health, Housing/Land/Property, Liberty & Security, Nationality, Social Protection, Work). Applicable rights are highlighted with electric cyan and expandable; non-applicable rights are visible but grayed out and non-expandable.
- ✅ **Citation Accuracy**: Similar cases display source domain and clickable web links to actual articles
- ✅ **Chat Loading Indicator**: Added animated typing indicator (pulsing dots) when AI is responding
- ✅ **PDF Download**: Implemented browser print-to-PDF functionality with user instructions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React with TypeScript (Vite).
**UI System**: shadcn/ui (Radix UI, Tailwind CSS) for a "Modern Professional Application with Chat Interface" aesthetic.
**State Management**: TanStack Query for server state, React Context API for global UI states, local React hooks for component state.
**Routing**: Wouter for client-side routing.
**Key Design Decisions**:
- Three-page workflow: Smart Intake → Verification Dashboard → Legal Report.
- Perplexity-inspired intake page with a clean chat interface, auto-expanding input, embedded action buttons, and dark premium aesthetics with electric cyan accents for AI elements.
- Collapsible chat-based sidebar for case history.
- Command palette (Cmd/Ctrl+K) for navigation.
- Dynamic animated background responding to AI processing states.
- Data stream loader visualization during report generation.
- **Typography**: Inter (interface), Georgia/serif (legal content), JetBrains Mono (case IDs, timestamps).

### Backend

**Server Framework**: Express.js with TypeScript.
**Database ORM**: Drizzle ORM configured for PostgreSQL.
**Storage Pattern**: `IStorage` abstraction with `MemStorage` for development, allowing easy swap to database-backed storage.
**API Design**: RESTful API structure under `/api`.

### Core Workflow

1.  **Smart Intake**: Perplexity-style interface for unstructured notes and file attachments. AI (LLM like Gemini 1.5 Pro or GPT-4) analyzes notes to extract entities (host country, needs, complications).
2.  **Verification Dashboard**: Displays AI-extracted information for lawyer review and allows structured data entry for missing details. Includes a chat component for AI clarification.
3.  **Legal Report**: Generates a comprehensive legal brief with citations, organized into sections like Executive Summary, Legal Framework, Analysis, and Recommendations. Includes copy-to-clipboard and PDF download.

### UI/UX Enhancements

-   **Command Palette**: `cmdk`-based for quick actions (e.g., "Start New Case").
-   **Animated Background**: Dynamic "AI Brain" background with UN blue gradient, responding to app states (idle, thinking, success).
-   **Data Stream Loader**: Visualizes the report generation process with sequential legal research steps and an animated progress bar.
-   **Chat Sidebar**: Fixed-width, collapsible sidebar displaying case history with status badges and search functionality.

## External Dependencies

### UI/Styling
-   **Radix UI**: Accessible, unstyled component primitives.
-   **shadcn/ui**: Styled components built on Radix UI and Tailwind CSS.
-   **cmdk**: Command palette.
-   **lucide-react**: Icon library.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **class-variance-authority, clsx, tailwind-merge**: CSS utility tools.

### Form Management
-   **react-hook-form**: Form state and validation.
-   **@hookform/resolvers**: Validation resolvers.
-   **zod**: TypeScript-first schema validation.
-   **drizzle-zod**: Drizzle ORM and Zod integration.

### Data Fetching & State
-   **@tanstack/react-query**: Asynchronous state management.
-   **wouter**: Lightweight routing.

### Database & ORM
-   **Drizzle ORM**: Type-safe SQL ORM for PostgreSQL.
-   **@neondatabase/serverless**: Neon serverless PostgreSQL driver.
-   **drizzle-kit**: Schema management CLI.
-   **connect-pg-simple**: PostgreSQL session store.

### Utilities
-   **date-fns**: Date manipulation.
-   **nanoid**: Unique ID generation.

### AI Integration (via Replit AI Integrations)
-   **OpenAI Whisper API**: Audio transcription (.mp3, .wav, .m4a) with secure file handling.
-   **OpenAI GPT-4o**: Entity extraction, expert legal assistant chat with RAG, report generation.
-   **OpenAI text-embedding-3-small**: Embeddings for legal documents and similarity search.
-   **RAG System**: Vector similarity search across chunked legal PDFs.

### AI Service Components
-   **PDF Processing Service**: Extracts and chunks text from PDFs, adds metadata.
-   **Embeddings Service**: Generates and caches embeddings, performs cosine similarity search.
-   **AI Service**: Orchestrates Whisper, GPT-4o for transcription, entity extraction, streaming RAG chat, and report generation.

### API Endpoints
-   **POST /api/intake/analyze**: Accepts text/audio, transcribes, extracts entities, creates case record.
-   **POST /api/chat**: Streaming RAG chat for legal clarification.
-   **POST /api/report/generate**: Generates legal brief with RAG search for similar cases.
-   **GET /api/documents/:filename**: Serves PDF files with security checks and page anchors.
```