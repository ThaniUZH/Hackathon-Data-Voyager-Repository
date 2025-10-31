import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Paperclip, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatAssistant } from "@/contexts/ChatAssistantContext";
import { useCase } from "@/contexts/CaseContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function ChatAssistant() {
  const { isChatOpen, setIsChatOpen } = useChatAssistant();
  const { currentCase } = useCase();
  const isOpen = isChatOpen;
  const setIsOpen = setIsChatOpen;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || isSending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          caseId: currentCase?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      const aiMessageId = (Date.now() + 1).toString();
      let aiContent = "";

      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              aiContent += data.content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: aiContent }
                    : msg
                )
              );
            }
            if (data.done) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
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
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[hsl(188,94%,50%)] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
            data-testid="button-open-chat"
            aria-label="Open case assistant"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 h-screen w-[450px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
            data-testid="chat-panel"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(188,94%,50%)]/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[hsl(188,94%,50%)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Case Assistant</h3>
                  <p className="text-xs text-muted-foreground">Ask me anything</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full"
                data-testid="button-close-chat"
                aria-label="Close chat assistant"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground max-w-xs">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Start a conversation with your case assistant</p>
                    <p className="text-xs mt-2">Ask questions about your case, legal procedures, or upload documents for review</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-[hsl(188,94%,50%)] text-white"
                            : "bg-card border border-border"
                        }`}
                        data-testid={`text-message-${msg.id}`}
                      >
                        {msg.isStreaming && !msg.content ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: "0ms"}} />
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: "200ms"}} />
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: "400ms"}} />
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Perplexity Style */}
            <div className="p-4 border-t border-border">
              <div className="relative border border-border rounded-3xl bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg">
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  data-testid="input-chat-message"
                  placeholder="Ask about legal procedures, case law..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-6 pt-4 pb-16 text-sm resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-breathing overflow-y-auto custom-scrollbar"
                  style={{ minHeight: '56px', maxHeight: '200px' }}
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
                        data-testid="button-remove-chat-file"
                        aria-label="Remove attached file"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Bar - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-card">
                  {/* Left side - File attachment */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      data-testid="input-chat-file"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full w-8 h-8"
                      data-testid="button-attach-chat"
                      aria-label="Attach file to message"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Right side - Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() && !selectedFile}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      message.trim() || selectedFile
                        ? "bg-[hsl(188,94%,50%)] text-white shadow-lg shadow-[hsl(188,94%,50%)]/30 hover:shadow-xl"
                        : "bg-muted text-muted-foreground opacity-40"
                    }`}
                    data-testid="button-send-chat"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
