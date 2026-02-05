import { Download, Upload, ExternalLink, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { t } from "@/lib/i18n";

interface ActionButtonsProps {
  onExport: () => void;
  onImport: () => void;
  onOpenOptions?: () => void;
  onOpenSettings?: () => void;
  isOptionsPage?: boolean;
}

const ActionButtons = ({
  onExport,
  onImport,
  onOpenOptions,
  onOpenSettings,
  isOptionsPage,
}: ActionButtonsProps) => {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onExport}
        title={t("btn_export_backup")}
        className="border-input hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
      >
        <Download className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onImport}
        title={t("btn_import_backup")}
        className="border-input hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
      >
        <Upload className="w-4 h-4" />
      </Button>
      {isOptionsPage && (
        <Button
          variant={"outline"}
          size="icon"
          onClick={onOpenSettings}
          title={t("btn_expand_options")}
          className="text-muted-foreground hover:text-foreground hover:bg-accent border-input"
        >
          <Settings className="w-4 h-4" />
        </Button>
      )}

      {onOpenOptions && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenOptions}
          title={t("btn_expand_options")}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </>
  );
};

export default ActionButtons;
