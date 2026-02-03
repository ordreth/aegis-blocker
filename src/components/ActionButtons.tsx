import { Download, Upload, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface ActionButtonsProps {
  onExport: () => void;
  onImport: () => void;
  onOpenOptions?: () => void;
}

const ActionButtons = ({
  onExport,
  onImport,
  onOpenOptions,
}: ActionButtonsProps) => {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onExport}
        title="Export Backup"
        className="border-input hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
      >
        <Download className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onImport}
        title="Import Backup"
        className="border-input hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
      >
        <Upload className="w-4 h-4" />
      </Button>

      {onOpenOptions && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenOptions}
          title="Expand"
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </>
  );
};

export default ActionButtons;
