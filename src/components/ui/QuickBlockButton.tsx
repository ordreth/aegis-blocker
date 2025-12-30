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
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 flex
        items-center justify-center gap-2 min-h-10 h-auto px-3 whitespace-normal break-all text-center
        transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
      >
        <Ban className="w-4 h-4" />
        <span>
          Block <strong>{domain}</strong> now
        </span>
      </Button>
    </div>
  );
};

export default QuickBlockButton;
