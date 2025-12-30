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

interface LockButtonProps {
  onEnableLock: () => void;
}

const LockButton = ({ onEnableLock }: LockButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-slate-700 hover:bg-slate-800 text-amber-500 hover:text-amber-400"
          title="Activate Absolute Mode"
        >
          <Unlock className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-500 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Activate Absolute Mode?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            By activating this mode, you{" "}
            <strong>will not be able to remove</strong> any existing rules for
            the next <strong>24 hours</strong>.
            <br />
            <br />
            You can still add new rules, but nothing can be undone until the
            time runs out.
            <br />
            <br />
            Are you sure you want to make this commitment?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEnableLock}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
          >
            Yes, Lock the Shield
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default LockButton;
