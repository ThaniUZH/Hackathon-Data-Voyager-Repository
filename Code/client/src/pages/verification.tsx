import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Globe, CheckCircle2, AlertCircle, FileCheck } from "lucide-react";
import { useBackground } from "@/contexts/BackgroundContext";
import { useCase } from "@/contexts/CaseContext";
import { useToast } from "@/hooks/use-toast";
import DataStreamLoader from "@/components/DataStreamLoader";
import { queryClient } from "@/lib/queryClient";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useChatAssistant } from "@/contexts/ChatAssistantContext";

export default function VerificationDashboard() {
  const [, setLocation] = useLocation();
  const { sidebarVisible } = useSidebarContext();
  const { isChatOpen } = useChatAssistant();
  const { currentCase, setCurrentReport } = useCase();
  const { toast } = useToast();
  const [medicalUrgency, setMedicalUrgency] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [additionalFactors, setAdditionalFactors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { setSuccess, setIdle, setThinking } = useBackground();

  useEffect(() => {
    setSuccess();
    return () => setIdle();
  }, [setSuccess, setIdle]);

  useEffect(() => {
    // Only redirect if no case and not generating (to prevent redirect during generation)
    if (!currentCase && !isGenerating) {
      setLocation("/");
    }
  }, [currentCase, setLocation, isGenerating]);

  const handleGenerate = async () => {
    if (!currentCase || isGenerating) {
      return;
    }

    try {
      setThinking();
      setIsGenerating(true);

      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caseId: currentCase.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate report");
      }

      const data = await response.json();
      
      if (data.success && data.report) {
        setCurrentReport(data.report);
        
        // Invalidate cases query to refresh sidebar (status updated to "completed")
        queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
        
        toast({
          title: "Report Generated",
          description: "Legal analysis complete",
        });

        // Navigate immediately after report is received
        setIsGenerating(false);
        setLocation("/report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
      setIdle();
      setIsGenerating(false);
    }
  };

  const toggleFactor = (factor: string) => {
    setAdditionalFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
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
      <div className={`w-full px-6 py-6 mx-auto ${
        sidebarVisible 
          ? 'max-w-4xl' 
          : 'max-w-5xl'
      }`}>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Verification Dashboard</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-xs text-muted-foreground">Case:</span>
                <span className="font-mono text-xs font-semibold text-primary">{currentCase?.caseNumber || "Loading..."}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 rounded-xl border-card-border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Extracted Facts</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-primary/10">
                  <Globe className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                      Host Country
                    </span>
                    <p className="font-semibold" data-testid="text-country">
                      {currentCase?.extractedEntities.hostCountry || "Not specified"}
                    </p>
                  </div>
                </div>

                {((currentCase?.extractedEntities.medicalNeeds && currentCase.extractedEntities.medicalNeeds.length > 0) ||
                  (currentCase?.extractedEntities.educationNeeds && currentCase.extractedEntities.educationNeeds.length > 0)) && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-primary/10">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-muted-foreground block mb-1.5">
                        Identified Needs
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCase?.extractedEntities.medicalNeeds && currentCase.extractedEntities.medicalNeeds.length > 0 && (
                          <Badge className="rounded-full px-2.5 py-0.5 text-xs bg-primary" data-testid="badge-need-medical">
                            Medical: {currentCase.extractedEntities.medicalNeeds.join(", ")}
                          </Badge>
                        )}
                        {currentCase?.extractedEntities.educationNeeds && currentCase.extractedEntities.educationNeeds.length > 0 && (
                          <Badge className="rounded-full px-2.5 py-0.5 text-xs bg-primary" data-testid="badge-need-education">
                            Education: {currentCase.extractedEntities.educationNeeds.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentCase?.extractedEntities.complications && currentCase.extractedEntities.complications.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-primary/10">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-muted-foreground block mb-1.5">
                        Complications
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCase.extractedEntities.complications.map((comp, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="rounded-full px-2.5 py-0.5 text-xs"
                            data-testid={`badge-complication-${idx}`}
                          >
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 rounded-xl border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Additional Details</h2>
                <Badge variant="secondary" className="rounded-full ml-auto text-xs">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Clarify details to improve accuracy, or skip if unavailable
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-lg border-l-4 border-l-primary bg-accent/20">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </span>
                    Medical urgency level?
                  </h3>
                  <RadioGroup value={medicalUrgency} onValueChange={setMedicalUrgency}>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <RadioGroupItem
                        value="urgent"
                        id="urgent"
                        data-testid="radio-medical-urgent"
                      />
                      <Label htmlFor="urgent" className="cursor-pointer flex-1 text-sm">
                        Urgent / Life-threatening
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <RadioGroupItem
                        value="general"
                        id="general"
                        data-testid="radio-medical-general"
                      />
                      <Label htmlFor="general" className="cursor-pointer flex-1 text-sm">
                        General / Non-urgent
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="p-4 rounded-lg border-l-4 border-l-primary bg-accent/20">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      2
                    </span>
                    Education level?
                  </h3>
                  <RadioGroup value={educationLevel} onValueChange={setEducationLevel}>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <RadioGroupItem
                        value="primary"
                        id="primary"
                        data-testid="radio-education-primary"
                      />
                      <Label htmlFor="primary" className="cursor-pointer flex-1 text-sm">
                        Primary School
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <RadioGroupItem
                        value="secondary"
                        id="secondary"
                        data-testid="radio-education-secondary"
                      />
                      <Label htmlFor="secondary" className="cursor-pointer flex-1 text-sm">
                        Secondary School (Teenager)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <RadioGroupItem
                        value="university"
                        id="university"
                        data-testid="radio-education-university"
                      />
                      <Label htmlFor="university" className="cursor-pointer flex-1 text-sm">
                        University
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="p-4 rounded-lg border-l-4 border-l-primary bg-accent/20">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      3
                    </span>
                    Other factors (check all that apply)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <Checkbox
                        id="housing"
                        checked={additionalFactors.includes("housing")}
                        onCheckedChange={() => toggleFactor("housing")}
                        data-testid="checkbox-housing"
                      />
                      <Label htmlFor="housing" className="cursor-pointer flex-1 text-sm">
                        Housing / Shelter Needed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover-elevate">
                      <Checkbox
                        id="family"
                        checked={additionalFactors.includes("family")}
                        onCheckedChange={() => toggleFactor("family")}
                        data-testid="checkbox-family"
                      />
                      <Label htmlFor="family" className="cursor-pointer flex-1 text-sm">
                        Family Unification
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3">
              <p className="text-xs text-muted-foreground flex-1">
                Generate report now or add details for better accuracy
              </p>
              <Button
                data-testid="button-generate"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 rounded-full font-semibold"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isGenerating && <DataStreamLoader duration={30000} />}
    </motion.div>
  );
}
