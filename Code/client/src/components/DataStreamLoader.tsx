import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const legalResearchSteps = [
  "Analyzing Swiss Asylum Act Article 44...",
  "Cross-referencing EU Dublin III Regulation...",
  "Parsing German Medical Ordinance 4.2...",
  "Reviewing Swiss Federal Constitution Article 19...",
  "Analyzing HarmoS Agreement provisions...",
  "Cross-checking cantonal education laws...",
  "Verifying healthcare access regulations...",
  "Compiling legal citations and sources...",
  "Translating German legal text to English...",
  "Validating refugee rights framework...",
  "Generating comprehensive legal analysis...",
];

interface DataStreamLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

export default function DataStreamLoader({ onComplete, duration = 5000 }: DataStreamLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState<string[]>([]);

  useEffect(() => {
    const stepDuration = duration / legalResearchSteps.length;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= legalResearchSteps.length) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 500);
          return prev;
        }
        return next;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  useEffect(() => {
    if (currentStep < legalResearchSteps.length) {
      setDisplayedSteps((prev) => [...prev, legalResearchSteps[currentStep]]);
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="p-8 max-w-2xl w-full mx-4 rounded-2xl border-primary/30 bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 animate-pulse">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Legal Research in Progress</h2>
            <p className="text-sm text-muted-foreground">
              Analyzing case data and compiling report...
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {displayedSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                index === displayedSteps.length - 1
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-accent/20"
              }`}
              style={{
                animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  index === displayedSteps.length - 1
                    ? "bg-primary animate-pulse"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={`text-sm font-mono ${
                  index === displayedSteps.length - 1
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 h-2 bg-accent/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${((currentStep + 1) / legalResearchSteps.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Processing step {currentStep + 1} of {legalResearchSteps.length}
        </p>
      </Card>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
