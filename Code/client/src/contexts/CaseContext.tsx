import { createContext, useContext, useState } from "react";
import type { Case, Report } from "@shared/schema";

interface CaseContextType {
  currentCase: Case | null;
  currentReport: Report | null;
  setCurrentCase: (caseData: Case) => void;
  setCurrentReport: (report: Report) => void;
  clearCase: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  const clearCase = () => {
    setCurrentCase(null);
    setCurrentReport(null);
  };

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        currentReport,
        setCurrentCase,
        setCurrentReport,
        clearCase,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
}
