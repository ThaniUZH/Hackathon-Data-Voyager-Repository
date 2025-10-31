import { createContext, useContext, useState, ReactNode } from "react";

type BackgroundState = "idle" | "thinking" | "success";

interface BackgroundContextType {
  state: BackgroundState;
  setState: (state: BackgroundState) => void;
  setThinking: () => void;
  setSuccess: () => void;
  setIdle: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BackgroundState>("idle");

  const setThinking = () => setState("thinking");
  const setSuccess = () => setState("success");
  const setIdle = () => setState("idle");

  return (
    <BackgroundContext.Provider
      value={{ state, setState, setThinking, setSuccess, setIdle }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}
