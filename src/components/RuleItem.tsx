import { cn } from "@/lib/utils";
import type { BlockRule } from "../lib/rules";
import { Button } from "./ui/button";
import { Trash2, Lock } from "lucide-react";
import { t } from "@/lib/i18n";

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
    <li
      className={cn(
        "flex justify-between items-center p-3 bg-secondary/5 border border-border rounded group hover:border-primary/40 transition-all duration-300",
        {
          "grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/10":
            isOptionsPage,
        },
      )}
    >
      <div
        className={cn({
          "col-span-10": isOptionsPage,
          "flex-1 min-w-0 pr-3": !isOptionsPage,
        })}
      >
        <span
          className={cn(
            "font-mono text-sm text-foreground block tracking-tight",
            {
              truncate: !isOptionsPage,
              "break-all": isOptionsPage,
            },
          )}
          title={rule.urlPattern}
        >
          {rule.urlPattern}
        </span>
      </div>

      <div className={isOptionsPage ? "col-span-2 text-right" : "shrink-0"}>
        {!isLocked ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(rule.id)}
            className="text-muted-foreground hover:text-aegis-danger-500  transition-all"
            aria-label={t("aria_remove_rule").replace(
              "{pattern}",
              rule.urlPattern,
            )}
          >
            {isOptionsPage ? t("btn_remove") : <Trash2 className="w-4 h-4" />}
          </Button>
        ) : (
          <Lock
            className="w-4 h-4 text-muted-foreground/30 ml-auto"
            aria-hidden="true"
          />
        )}
      </div>
    </li>
  );
};

export default RuleItem;
