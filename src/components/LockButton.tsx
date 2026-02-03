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

interface LockButtonProps {
  onEnableLock: () => void;
}

const descriptionText =
  "By activating this mode, you {text-foreground:will not be able to remove} any existing rules for the next {text-foreground:24 hours}.\n\n" +
  "You can still add new rules, but nothing can be undone until the time runs out.\n\n" +
  "Are you sure you want to make this commitment?";

const LockButton = ({ onEnableLock }: LockButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-input hover:bg-accent hover:text-primary text-primary transition-all duration-300"
          title="Activate Absolute Mode"
        >
          <Unlock className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-card border-border text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" /> Activate Absolute Mode?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm font-medium">
            {Parsers.parseStyledText(descriptionText)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEnableLock}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-none font-bold"
          >
            Yes, Lock the Shield
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default LockButton;
