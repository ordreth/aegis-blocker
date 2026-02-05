import { useSecurity } from "@/hooks";
import { t } from "@/lib/i18n";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { cn } from "@/lib/utils";
import { ShieldAlert, Check, Copy, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

interface PasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordSetupModal({
  isOpen,
  onClose,
}: PasswordSetupModalProps) {
  const { setupPassword } = useSecurity();

  const [step, setStep] = useState<1 | 2>(1);

  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleCreate = async () => {
    if (!pass || pass.length < 4) {
      return;
    }
    if (pass !== confirm) {
      setError(t("error_password_mismatch"));
      return;
    }

    const code = await setupPassword(pass);
    setRecoveryCode(code);
    setStep(2);
    setError("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleFinish = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setPass("");
      setConfirm("");
      setHasConfirmed(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-card-foreground sm:max-w-md">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>{t("setup_password_title")}</DialogTitle>
              <DialogDescription>{t("setup_password_desc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("label_new_password")}</Label>
                <Input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="bg-secondary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("label_confirm_password")}</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  className={cn(
                    "bg-secondary/20",
                    error && "border-destructive",
                  )}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                {t("btn_cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={!pass || !confirm}>
                {t("btn_create_vault")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <ShieldAlert className="w-6 h-6" />
                <span className="font-bold text-sm uppercase tracking-wider">
                  Crucial Step
                </span>
              </div>
              <DialogTitle>{t("recovery_step_title")}</DialogTitle>
              <DialogDescription>{t("recovery_step_desc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="relative group">
                <div className="p-4 bg-secondary/30 border border-primary/20 rounded-lg text-center font-mono text-xl tracking-wider text-primary break-all select-all">
                  {recoveryCode}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 h-8"
                  onClick={handleCopy}
                >
                  {hasCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 text-destructive"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                  {t("recovery_warning")}
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="saved"
                  checked={hasConfirmed}
                  onCheckedChange={(c) => setHasConfirmed(c as boolean)}
                />
                <label
                  htmlFor="saved"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("checkbox_saved_confirmation")}
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleFinish}
                disabled={!hasConfirmed}
                className="w-full sm:w-auto"
              >
                {t("btn_finish_setup")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
