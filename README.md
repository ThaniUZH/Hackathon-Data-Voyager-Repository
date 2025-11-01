## 💻 Project Documentation
# **Virtual Legal Assistance Rights Mapping**

## **Team Members**

| Name             |
|------------------|
| Baran Özgür Tas  |  
| Erik Avtandilyan |  
| Thani Al-Thani   |

## **The Challenge**

This project was created for the UNHCR Legal Assistance Challenge, aiming to support pro bono lawyers in providing faster, clearer, and more accurate legal advice to refugees.

Refugee lawyers currently face major obstacles:

- **Fragmented information:** Legal texts are spread across multiple institutions and documents.  
- **Language barriers:** Many key sources are not in the lawyer’s working language.  
- **Manual research:** Lawyers must read and cross-check complex legal materials manually.  

These issues cause delays, inconsistencies, and sometimes inaccurate guidance, which can result in lost rights or violations for refugees.

## **Our Solution**
UNHCR Rights-Mapper is an AI-powered legal assistance tool for pro bono lawyers working with refugee cases. It automates the analysis of unstructured case notes, extracts key information, and generates comprehensive, cited legal reports. The application features a modern chat-based interface that tracks each case as a conversation, aiming for professional clarity and trust. Its core purpose is to eliminate the manual, time-consuming process of sifting through fragmented, multilingual legal documents to determine refugee rights, transforming messy case notes into verified legal briefs.
### Core Workflow
- **Smart Intake**: A clean interface for unstructured notes and file attachments. AI analyzes notes to extract entities (host country, needs, complications).
- **Verification Dashboard**: Displays AI-extracted information for lawyer review and allows optional data entry for additional details.
- **Legal Report**: Generates a comprehensive legal brief analyzing all 11 refugee rights categories.For each applicable right, the system searches identifies relevant laws and precedents and generates detailed sections including AI Summary, Legal Basis with citations, Legal Complications, Potential Risks, and Similar Cases from web research. Applicable rights are highlighted and expandable, while non-applicable rights are grayed out. Each section includes confidence scoring and copy to clipboard functionality.

## **Tech Stack**

### Frontend
- **Framework:** React 18 + TypeScript + Vite  
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)  
- **State Management:** TanStack Query (server state), React Context (global UI), React hooks (local state)  
- **Routing:** Wouter  
- **Design Flow:** Three-page workflow (Intake → Verification → Report)

### Backend
- **Framework:** Express.js + TypeScript  
- **API:** RESTful endpoints under `/api`  


