import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FileText, Heart, GraduationCap, Download, ArrowLeft, Home, Copy, Check, 
  ExternalLink, TrendingUp, Scale, AlertTriangle, ShieldAlert, Shield, 
  FileCheck, Users, Footprints, Building, Lock, Flag, HandHeart, Briefcase, LucideIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useBackground } from "@/contexts/BackgroundContext";
import { useCase } from "@/contexts/CaseContext";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useChatAssistant } from "@/contexts/ChatAssistantContext";
import type { RightsAnalysis } from "@shared/schema";

// Configuration for all 11 rights categories
const RIGHTS_CONFIG: Record<string, {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}> = {
  asylum: {
    id: "asylum",
    title: "Asylum",
    icon: Shield,
    description: "The right to seek and enjoy safety in another country to escape persecution or serious harm."
  },
  documentation: {
    id: "documentation",
    title: "Documentation",
    icon: FileCheck,
    description: "The right to have legal identity documents for accessing essential services."
  },
  education: {
    id: "education",
    title: "Education",
    icon: GraduationCap,
    description: "The right for all children and adults to access education."
  },
  family_life: {
    id: "family_life",
    title: "Family Life",
    icon: Users,
    description: "The right to family unity and efforts to reunite separated families."
  },
  freedom_movement: {
    id: "freedom_movement",
    title: "Freedom of Movement",
    icon: Footprints,
    description: "The right to move freely within the host country."
  },
  health: {
    id: "health",
    title: "Health",
    icon: Heart,
    description: "The right to access medical care, including physical and mental health services."
  },
  housing: {
    id: "housing",
    title: "Housing, Land & Property",
    icon: Building,
    description: "The right to adequate shelter and property protection."
  },
  liberty_security: {
    id: "liberty_security",
    title: "Liberty & Security of Person",
    icon: Lock,
    description: "The right to be protected from arbitrary arrest and detention."
  },
  nationality: {
    id: "nationality",
    title: "Nationality & Facilitated Naturalization",
    icon: Flag,
    description: "The right to have a nationality and path to citizenship."
  },
  social_protection: {
    id: "social_protection",
    title: "Social Protection",
    icon: HandHeart,
    description: "The right to access social safety nets and support systems."
  },
  work: {
    id: "work",
    title: "Work & Workplace Rights",
    icon: Briefcase,
    description: "The right to work legally and be treated fairly in the workplace."
  }
};

export default function LegalReport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { sidebarVisible } = useSidebarContext();
  const { isChatOpen } = useChatAssistant();
  const { currentCase, currentReport } = useCase();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { setSuccess, setIdle } = useBackground();

  useEffect(() => {
    setSuccess();
    return () => setIdle();
  }, [setSuccess, setIdle]);

  useEffect(() => {
    if (!currentReport || !currentCase) {
      setLocation("/");
    }
  }, [currentReport, currentCase, setLocation]);

  if (!currentReport || !currentCase) {
    return null;
  }

  const reportDate = new Date(currentReport.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDownload = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Select 'Save as PDF' as your printer to download the report",
    });
  };

  const handleCopySection = async (sectionName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionName);
      toast({
        title: "Copied to clipboard",
        description: `${sectionName} section copied successfully`,
      });
      setTimeout(() => {
        setCopiedSection(null);
      }, 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getConfidenceBadge = (confidence: "low" | "medium" | "high") => {
    const configs = {
      high: { label: "High Confidence", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      medium: { label: "Medium Confidence", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      low: { label: "Low Confidence", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    const config = configs[confidence];
    return (
      <Badge className={`${config.className} border rounded-full`} data-testid={`badge-confidence-${confidence}`}>
        <TrendingUp className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Create a map of rights analysis by type for quick lookup
  const analysisMap = new Map<string, RightsAnalysis>();
  currentReport.rightsAnalysis?.forEach((analysis) => {
    analysisMap.set(analysis.rightType, analysis);
  });

  // Render a single rights section
  const renderRightsSection = (rightId: string) => {
    const config = RIGHTS_CONFIG[rightId];
    const analysis = analysisMap.get(rightId);
    const isApplicable = !!analysis;
    const Icon = config.icon;

    // For non-applicable rights, render a disabled/grayed out version
    if (!isApplicable) {
      return (
        <div
          key={rightId}
          className="border rounded-xl px-4 py-4 opacity-40 cursor-not-allowed bg-muted/10"
          data-testid={`rights-section-${rightId}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted/20">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-muted-foreground" data-testid={`text-section-${rightId}`}>
                {config.title}
              </h2>
            </div>
            <Badge variant="outline" className="rounded-full text-xs">
              Not Applicable
            </Badge>
          </div>
        </div>
      );
    }

    // For applicable rights, render full expandable section with electric cyan highlights
    const sectionContent = `${config.title.toUpperCase()}

Summary:
${analysis.summary}

Legal Basis:
${analysis.legalBasis}

Citation:
"${analysis.citation.quote}"

Source: ${analysis.citation.source}`;

    return (
      <AccordionItem
        key={rightId}
        value={rightId}
        className="border rounded-xl px-4 transition-all duration-300 hover:border-primary/50 border-primary/30"
        data-testid={`rights-section-${rightId}`}
      >
        <AccordionTrigger
          className="hover:no-underline py-4 transition-all duration-300 hover-elevate rounded-lg"
          data-testid={`accordion-${rightId}`}
        >
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-left" data-testid={`text-section-${rightId}`}>
                {config.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {getConfidenceBadge(analysis.confidenceLevel)}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="flex justify-end mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopySection(config.title, sectionContent)}
              className="rounded-full"
              data-testid={`button-copy-${rightId}`}
            >
              {copiedSection === config.title ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Section
                </>
              )}
            </Button>
          </div>

          <Card className="p-6 rounded-2xl border-l-4 border-l-primary mb-5 bg-accent/20">
            <Badge className="mb-3 rounded-full bg-primary">AI Summary</Badge>
            <p className="leading-relaxed text-base" data-testid={`text-${rightId}-summary`}>
              {analysis.summary}
            </p>
          </Card>

          {analysis.legalBasis && (
            <div className="mb-5">
              <h3 className="text-lg font-semibold mb-3">Legal Basis</h3>
              <div className="font-serif leading-relaxed text-justify bg-muted/20 p-6 rounded-xl border border-muted">
                <p>{analysis.legalBasis}</p>
              </div>
            </div>
          )}

          <Card className="p-5 rounded-xl bg-primary/5 border-primary/20">
            <div className="text-xs uppercase tracking-wider font-medium mb-3 text-muted-foreground">
              Source Citation
            </div>
            <p className="font-serif italic text-sm leading-relaxed mb-4">
              "{analysis.citation.quote}"
            </p>
            <div className="font-medium text-sm" data-testid={`text-${rightId}-citation`}>
              Source: {analysis.citation.source}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Card className="p-5 rounded-xl bg-amber-500/5 border-amber-500/20" data-testid={`card-${rightId}-complications`}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold">Legal Complications</h3>
              </div>
              <ul className="space-y-2">
                {analysis.complications.map((complication, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="text-amber-400 mt-1">•</span>
                    <span className="flex-1">{complication}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 rounded-xl bg-red-500/5 border-red-500/20" data-testid={`card-${rightId}-risks`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold">Potential Risks</h3>
              </div>
              <ul className="space-y-2">
                {analysis.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="flex-1">{risk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Similar Cases</h3>
              <Badge variant="outline" className="rounded-full text-xs">
                AI-Analyzed
              </Badge>
            </div>
            <div className="space-y-3">
              {analysis.similarCases && analysis.similarCases.length > 0 ? (
                analysis.similarCases.map((case_: any) => (
                  <a
                    key={case_.id}
                    href={case_.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    data-testid={`link-similar-case-${case_.id}`}
                  >
                    <Card className="p-4 rounded-xl border hover-elevate transition-all duration-300" data-testid={`similar-case-${case_.id}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-base flex-1">{case_.title}</h4>
                        {getConfidenceBadge(case_.confidence)}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {case_.description}
                      </p>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">Source: {case_.filename}</div>
                          <div className="text-primary/70 hover:text-primary transition-colors">Click to view article →</div>
                        </div>
                      </div>
                    </Card>
                  </a>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-xl border border-dashed">
                  No similar cases found
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex-1 overflow-y-auto"
      style={
        !sidebarVisible && isChatOpen 
          ? { paddingRight: '450px' }
          : undefined
      }
    >
      <div className={`w-full px-8 py-6 mx-auto ${
        sidebarVisible 
          ? 'max-w-6xl' 
          : 'max-w-6xl'
      }`}>
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => setLocation("/verification")}
            data-testid="button-back"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verification
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/")} className="rounded-full">
              <Home className="w-4 h-4 mr-2" />
              New Case
            </Button>
            <Button onClick={handleDownload} data-testid="button-download" className="rounded-full">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 rounded-2xl border-card-border">
              <div className="border-b border-border pb-4 mb-6">
                <div className="flex items-start justify-between gap-6 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold" data-testid="text-report-title">
                        Legal Rights Report
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Provisional assessment for refugee assistance
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-accent/30 p-4 rounded-xl border border-primary/20">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Case Number
                    </div>
                    <div className="font-mono text-lg font-bold text-primary" data-testid="text-case-number">
                      {currentReport.caseNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Generated
                    </div>
                    <div className="text-sm font-medium">{reportDate}</div>
                  </div>
                </div>
              </div>

              {/* Render all 11 rights sections */}
              <Accordion type="multiple" className="space-y-3">
                {Object.keys(RIGHTS_CONFIG).map((rightId) => renderRightsSection(rightId))}
              </Accordion>

              <div className="mt-8 pt-5 border-t border-border text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Disclaimer:</strong> This report is
                  generated using AI-assisted analysis and should be used as a preliminary
                  assessment only. Always consult with qualified legal professionals for
                  case-specific advice.
                </p>
                <p className="text-xs">
                  Generated by UNHCR Rights-Mapper | Confidential Legal Document
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
