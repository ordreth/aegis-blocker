import { useState } from "react";
import { ShieldAlert, Lock, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onRecover: (code: string) => Promise<boolean>;
}

const LockScreen = ({ onUnlock, onRecover }: LockScreenProps) => {
  const [view, setView] = useState<"login" | "recovery">("login");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(false);
  const [isShake, setIsShake] = useState(false);

  const triggerError = () => {
    setError(true);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    const success = await onUnlock(inputValue);

    if (!success) {
      triggerError();
      setInputValue("");
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    const code = inputValue.toUpperCase().trim();
    const success = await onRecover(code);

    if (!success) {
      triggerError();
    }
  };
  return (
    <div
      className="flex flex-col items-center justify-center w-full  min-w-[400px] min-h-[500px]
    p-4 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-hidden"
    >
      <div
        className={cn(
          "w-full max-w-sm space-y-6 transition-transform duration-100",
          isShake ? "translate-x-[-10px] animate-pulse" : "",
        )}
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_30px_-10px_rgba(255,215,0,0.3)]">
              {view === "login" ? (
                <Lock className="w-8 h-8 text-primary" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {view === "login" ? t("vault_title") : t("recovery_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {view === "login" ? t("vault_desc") : t("recovery_desc")}
          </p>
        </div>

        <form
          onSubmit={view === "login" ? handleUnlock : handleRecovery}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>
              {view === "login"
                ? t("label_master_password")
                : t("label_recovery_code")}
            </Label>
            <Input
              type={view === "login" ? "password" : "text"}
              placeholder={view === "login" ? "••••••••" : "AEGIS-XXXX-XXXX"}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(false);
              }}
              className={cn(
                "bg-secondary/20 border-input text-center font-mono tracking-widest",
                error && "border-destructive focus-visible:ring-destructive",
              )}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive text-center font-medium animate-in fade-in slide-in-from-top-1">
                {view === "login"
                  ? t("error_wrong_password")
                  : t("error_invalid_code")}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full font-bold h-11",
              view === "recovery" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            disabled={!inputValue}
          >
            {view === "login" ? (
              <>
                <KeyRound className="w-4 h-4 mr-2" /> {t("btn_unlock")}
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 mr-2" />
                {t("btn_reset_vault")}
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setView(view === "login" ? "recovery" : "login");
              setInputValue("");
              setError(false);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
          >
            {view === "login"
              ? t("link_forgot_password")
              : t("btn_back_to_login")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
