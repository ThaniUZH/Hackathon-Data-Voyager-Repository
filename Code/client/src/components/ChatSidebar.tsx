import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Scale, X, Check, Clock } from "lucide-react";
import { useCase } from "@/contexts/CaseContext";
import { formatDistanceToNow } from "date-fns";
import type { Case } from "@shared/schema";

interface ChatSidebarProps {
  onHide: () => void;
}

export default function ChatSidebar({ onHide }: ChatSidebarProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { setCurrentCase, setCurrentReport } = useCase();
  
  // Fetch real cases from API
  const { data: casesData, isLoading } = useQuery<{ success: boolean; cases: Case[] }>({
    queryKey: ["/api/cases"],
  });

  const cases = casesData?.cases || [];

  // Filter cases based on search query
  const filteredCases = cases.filter((caseItem) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      caseItem.caseNumber.toLowerCase().includes(searchLower) ||
      caseItem.extractedEntities.hostCountry?.toLowerCase().includes(searchLower) ||
      caseItem.notes.toLowerCase().includes(searchLower)
    );
  });

  // Generate title from case data
  const getCaseTitle = (caseItem: Case) => {
    const entities = caseItem.extractedEntities;
    const parts = [];
    
    if (entities.hostCountry) {
      parts.push(entities.hostCountry);
    }
    
    if (entities.medicalNeeds && entities.medicalNeeds.length > 0) {
      parts.push("Medical");
    }
    
    if (entities.educationNeeds && entities.educationNeeds.length > 0) {
      parts.push("Education");
    }
    
    if (parts.length === 0) {
      return "Refugee Case";
    }
    
    return parts.join(" - ");
  };

  const getStatusIcon = (status: Case["status"]) => {
    if (status === "completed") {
      return <Check className="w-4 h-4 text-green-400" />;
    }
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const handleNewCase = () => {
    setCurrentCase(null);
    setCurrentReport(null);
    setLocation("/");
  };

  const handleCaseClick = async (caseItem: Case) => {
    // Load the case into context
    setCurrentCase(caseItem);
    
    // Try to fetch the report if case is completed
    if (caseItem.status === "completed") {
      try {
        const response = await fetch(`/api/report/case/${caseItem.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.report) {
            setCurrentReport(data.report);
            setLocation("/report");
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      }
    }
    
    // If no report or case not completed, go to verification
    setLocation("/verification");
  };

  return (
    <div className="w-80 bg-card/50 backdrop-blur-sm border-r border-border h-screen flex flex-col">
      {/* Logo at top */}
      <div className="p-6 flex items-center justify-between">
        <Scale className="w-8 h-8 text-foreground" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onHide}
          className="rounded-full -mr-2"
          data-testid="button-hide-sidebar"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* New Case Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleNewCase}
          className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/50 border border-slate-700 text-[hsl(188,94%,50%)] hover:bg-slate-700/70 transition-all duration-200 flex items-center justify-center gap-2"
          data-testid="button-new-case"
        >
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-3xl bg-slate-800/50 border border-slate-700 text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
            data-testid="input-search-cases"
          />
        </div>
      </div>

      {/* Case List */}
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading && (
          <div className="py-8 text-center text-sm text-slate-400">
            Loading cases...
          </div>
        )}
        
        {!isLoading && filteredCases.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">
            {searchQuery ? "No cases found" : "No cases yet"}
          </div>
        )}
        
        {!isLoading && filteredCases.map((caseItem, index) => (
          <div key={caseItem.id}>
            <div
              onClick={() => handleCaseClick(caseItem)}
              className="py-4 px-3 rounded-2xl hover:bg-slate-700/40 cursor-pointer transition-all duration-200"
              data-testid={`case-${caseItem.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="font-medium text-slate-100 line-clamp-2 flex-1">
                  {getCaseTitle(caseItem)}
                </h3>
                <div className="flex-shrink-0">
                  {getStatusIcon(caseItem.status)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-mono">{caseItem.caseNumber}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {getRelativeTime(caseItem.createdAt)}
              </div>
            </div>
            {index < filteredCases.length - 1 && (
              <hr className="border-slate-700/50 my-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
