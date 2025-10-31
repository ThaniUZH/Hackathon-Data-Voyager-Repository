import { createContext, useContext, useState, ReactNode } from "react";

interface ChatAssistantContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatAssistantContext = createContext<ChatAssistantContextType | undefined>(undefined);

export function ChatAssistantProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatAssistantContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </ChatAssistantContext.Provider>
  );
}

export function useChatAssistant() {
  const context = useContext(ChatAssistantContext);
  if (context === undefined) {
    throw new Error("useChatAssistant must be used within a ChatAssistantProvider");
  }
  return context;
}
