import type { BlockRule } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import RuleItem from "./RuleItem";
import { t } from "@/lib/i18n";

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
          <div className="col-span-10">{t("table_header_url")}</div>
          <div className="col-span-2 text-right">
            {t("table_header_action")}
          </div>
        </div>
      )}

      <div className={isOptionsPage ? "divide-y divide-border" : "space-y-2"}>
        {rules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/50">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-foreground font-medium">
              {t("empty_state_title")}
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              {t("empty_state_desc")}
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
