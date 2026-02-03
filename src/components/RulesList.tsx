import type { BlockRule } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import RuleItem from "./RuleItem";

interface RulesListProps {
  isOptionsPage: boolean;
  rules: BlockRule[];
  isLocked: boolean;
  onRemove: (id: number) => void;
}

const RulesList = ({
  isOptionsPage,
  rules,
  isLocked,
  onRemove,
}: RulesListProps) => {
  return (
    <div
      className={cn("flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar")}
    >
      {isOptionsPage && (
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-muted-foreground text-sm font-medium">
          <div className="col-span-10">URL pattern</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
      )}

      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/50">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-foreground font-medium">No active rules.</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Your browsing is now completely unrestricted.
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              isOptionsPage={isOptionsPage}
              isLocked={isLocked}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RulesList;
