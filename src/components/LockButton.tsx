import { Unlock, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import Parsers from "@/lib/parsers";
import { t } from "@/lib/i18n";
import { useSettings } from "@/hooks";
import { formatDuration } from "@/lib/utils";

interface LockButtonProps {
  onEnableLock: () => void;
}

const LockButton = ({ onEnableLock }: LockButtonProps) => {
  const { settings } = useSettings();

  const durationText = formatDuration(settings.absoluteModeDurationHours);

  const descriptionText = t("modal_description_styled", [durationText]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-input hover:bg-accent hover:text-primary text-primary transition-all duration-300"
          title={t("btn_activate_absolute_mode_tooltip")}
        >
          <Unlock className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-card border-border text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" /> {t("modal_title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm font-medium whitespace-pre-line">
            {Parsers.parseStyledText(descriptionText)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80">
            {t("btn_cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEnableLock}
            className="bg-destructive dark:text-destructive-foreground text-white hover:bg-destructive/90 border-none font-bold"
          >
            {t("modal_confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default LockButton;
