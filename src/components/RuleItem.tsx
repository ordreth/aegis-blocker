import { cn } from "@/lib/utils";
import type { BlockRule } from "../lib/rules";
import { Button } from "./ui/button";
import { Trash2, Lock } from "lucide-react";

interface RuleItemProps {
  rule: BlockRule;
  isOptionsPage: boolean;
  isLocked: boolean;
  onRemove: (id: number) => void;
}

const RuleItem = ({
  rule,
  isOptionsPage,
  isLocked,
  onRemove,
}: RuleItemProps) => {
  return (
    <div
      className={cn(
        "flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded group hover:border-slate-600 transition-colors",
        {
          "grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-900/50 transition-colors group":
            isOptionsPage,
        }
      )}
    >
      <div className={isOptionsPage ? "col-span-10" : "flex-1 min-w-0"}>
        <span className="font-mono text-sm text-slate-300 truncate block">
          {rule.urlPattern}
        </span>
      </div>

      <div className={isOptionsPage ? "col-span-2 text-right" : ""}>
        {!isLocked ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(rule.id)}
            className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            {isOptionsPage ? "Remove" : <Trash2 className="w-4 h-4" />}
          </Button>
        ) : (
          <Lock className="w-4 h-4 text-slate-700 ml-auto" />
        )}
      </div>
    </div>
  );
};

export default RuleItem;
