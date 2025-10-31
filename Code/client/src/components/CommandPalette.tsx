import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, FileText, Printer, HelpCircle, Home } from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleAction = (action: string) => {
    setOpen(false);
    switch (action) {
      case "new-case":
        setLocation("/");
        break;
      case "view-reports":
        console.log("View saved reports");
        break;
      case "print":
        window.print();
        break;
      case "help":
        console.log("Show help");
        break;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleAction("new-case")}
            data-testid="command-new-case"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Start New Case</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleAction("view-reports")}
            data-testid="command-view-reports"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>View Saved Reports</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleAction("print")}
            data-testid="command-print"
          >
            <Printer className="mr-2 h-4 w-4" />
            <span>Print Current Report</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => handleAction("help")}
            data-testid="command-help"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help / Contact Support</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
