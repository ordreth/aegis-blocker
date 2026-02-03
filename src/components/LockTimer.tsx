import { Timer } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface LockTimerProps {
  timeLeft: string;
}

const LockTimer = ({ timeLeft }: LockTimerProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Time remaining: ${timeLeft}`}
          className="border-destructive/40 bg-destructive/10 text-destructive-foreground
          hover:bg-destructive/20 hover:text-destructive-foreground transition-all duration-300"
        >
          <Timer className="w-4 h-4 animate-pulse" />
        </Button>
      </TooltipTrigger>

      <TooltipContent
        side="bottom"
        align="end"
        className="bg-card border-border text-foreground shadow-xl"
      >
        <p className="font-sans text-xs text-muted-foreground mb-1">
          Absolute Mode Active
        </p>
        <p className="font-mono text-sm flex items-center gap-2">
          Unlocks in:{" "}
          <span className="font-bold text-destructive-foreground">
            {timeLeft}
          </span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default LockTimer;
