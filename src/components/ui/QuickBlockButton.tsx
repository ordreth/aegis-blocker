import { Ban } from "lucide-react";
import { Button } from "./button";

interface QuickBlockButtonProps {
  domain: string;
  onBlock: () => void;
}

const QuickBlockButton = ({ domain, onBlock }: QuickBlockButtonProps) => {
  return (
    <div className="mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <Button
        onClick={onBlock}
        className="w-full bg-destructive/15 hover:bg-destructive/25 text-destructive-foreground border border-destructive/30 flex
        items-center justify-center gap-2 min-h-10 h-auto px-3 whitespace-normal break-all text-center
        transition-all shadow-lg shadow-destructive/5 hover:shadow-destructive/20"
      >
        <Ban className="w-4 h-4 shrink-0" />
        <span>
          Block <strong>{domain}</strong> now
        </span>
      </Button>
    </div>
  );
};

export default QuickBlockButton;
