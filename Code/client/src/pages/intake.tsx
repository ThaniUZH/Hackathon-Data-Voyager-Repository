import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp } from "lucide-react";
import { useBackground } from "@/contexts/BackgroundContext";
import { useCase } from "@/contexts/CaseContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function IntakePage() {
  const [, setLocation] = useLocation();
  const [caseNotes, setCaseNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setIdle, setThinking } = useBackground();
  const { setCurrentCase } = useCase();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIdle();
  }, [setIdle]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 500);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [caseNotes]);

  const handleAnalyze = async () => {
    if ((!caseNotes.trim() && !selectedFile) || isAnalyzing) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setThinking();

      const formData = new FormData();
      if (caseNotes.trim()) {
        formData.append("notes", caseNotes);
      }
      if (selectedFile) {
        formData.append("audio", selectedFile);
      }

      const response = await fetch("/api/intake/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze case");
      }

      const data = await response.json();
      
      if (data.success && data.case) {
        setCurrentCase(data.case);
        
        // Invalidate cases query to refresh sidebar
        queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
        
        toast({
          title: "Analysis Complete",
          description: `Case ${data.case.caseNumber} created successfully`,
        });
        setTimeout(() => {
          setLocation("/verification");
        }, 500);
      }
    } catch (error) {
      console.error("Error analyzing case:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze case notes",
        variant: "destructive",
      });
      setIdle();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-12"
    >
      {/* Page Title */}
      <div className="w-full max-w-3xl mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">UNHCR Rights-Mapper</h1>
        <p className="text-muted-foreground">AI-powered legal case analysis</p>
      </div>

      {/* Perplexity-style Input Container */}
      <div className="w-full max-w-3xl">
        <div className="relative border border-border rounded-3xl bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            data-testid="input-case-notes"
            placeholder="Paste your unstructured case notes... The AI will understand."
            value={caseNotes}
            onChange={(e) => setCaseNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-6 pt-4 pb-16 text-base resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-breathing overflow-y-auto custom-scrollbar"
            style={{ minHeight: '56px', maxHeight: '500px' }}
            rows={1}
          />

          {/* File attachment indicator */}
          {selectedFile && (
            <div className="px-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
                <Paperclip className="w-3 h-3" />
                <span className="text-xs">{selectedFile.name}</span>
                <button
                  onClick={handleRemoveFile}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  data-testid="button-remove-file"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Action Bar - Bottom of textarea */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-card">
            {/* Left side - File attachment */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.ogg"
                data-testid="input-file"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full w-8 h-8"
                data-testid="button-attach"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            {/* Right side - Send button */}
            <Button
              data-testid="button-analyze"
              onClick={handleAnalyze}
              disabled={(!caseNotes.trim() && !selectedFile) || isAnalyzing}
              size="icon"
              style={{
                backgroundColor: (caseNotes.trim() || selectedFile) && !isAnalyzing ? 'hsl(var(--ai-accent))' : undefined,
                color: (caseNotes.trim() || selectedFile) && !isAnalyzing ? 'hsl(var(--ai-accent-foreground))' : undefined
              }}
              className={`rounded-full w-8 h-8 transition-all duration-300 ${
                (caseNotes.trim() || selectedFile) && !isAnalyzing ? 'ai-glow opacity-100' : 'opacity-40'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Helper text below input */}
        <div className="mt-3 px-2 text-xs text-muted-foreground/60 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </motion.div>
  );
}
