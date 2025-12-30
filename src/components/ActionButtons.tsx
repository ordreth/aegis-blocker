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
        className="border-slate-700 hover:bg-slate-800 text-slate-300"
      >
        <Download className="w-4 h-4 text-white" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onImport}
        title="Import Backup"
        className="border-slate-700 hover:bg-slate-800 text-slate-300"
      >
        <Upload className="w-4 h-4 text-white" />
      </Button>
      {onOpenOptions && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenOptions}
          title="Expand"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </Button>
      )}
    </>
  );
};

export default ActionButtons;
