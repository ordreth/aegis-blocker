import { Timer } from "lucide-react";
import { Button } from "./ui/button";

interface LockTimerProps {
  timeLeft: string;
}

const LockTimer = ({ timeLeft }: LockTimerProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-900/50 bg-red-900/20 text-red-500 cursor-not-allowed hover:bg-red-900/20 font-mono text-xs w-28"
    >
      <Timer className="w-3 h-3 mr-2" />
      {timeLeft}
    </Button>
  );
};

export default LockTimer;
