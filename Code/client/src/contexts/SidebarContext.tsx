import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <SidebarContext.Provider value={{ sidebarVisible, setSidebarVisible }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}
