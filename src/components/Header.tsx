import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import LockButton from "./LockButton";
import LockTimer from "./LockTimer";
import ActionButtons from "./ActionButtons";
import { t } from "@/lib/i18n";

interface HeaderProps {
  isOptionsPage: boolean;
  isLocked: boolean;
  timeLeft: string;
  onEnableLock: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenOptions?: () => void;
  onOpenSettings?: () => void;
}

const Header = ({
  isOptionsPage,
  isLocked,
  timeLeft,
  onEnableLock,
  onExport,
  onImport,
  onOpenOptions,
  onOpenSettings,
}: HeaderProps) => {
  return (
    <header
      className={cn(
        "flex justify-between items-center border-b transition-colors duration-500 p-4 border-border bg-transparent",
        "backdrop-blur-sm",
        {
          "mb-8 py-6 border-border": isOptionsPage,
          "bg-destructive/10 border-destructive/20": isLocked,
        },
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn("rounded-lg transition-colors duration-300 ", {
            "bg-destructive/40": isLocked,
          })}
        >
          <img
            src="/assets/icons/48.png"
            alt="Aegis Logo"
            className="size-12 rounded-md"
          />
        </div>

        <div>
          <h1
            className={cn("font-bold text-foreground tracking-tight text-lg", {
              "text-2xl": isOptionsPage,
            })}
          >
            {isLocked ? t("status_locked") : t("status_active")}
          </h1>
          {isOptionsPage && (
            <p className="text-muted-foreground text-sm font-medium">
              {isLocked
                ? `${t("header_desc_locked")} ${timeLeft}`
                : t("header_desc_normal")}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {!isLocked && <LockButton onEnableLock={onEnableLock} />}
        {isLocked && <LockTimer timeLeft={timeLeft} />}

        <div className="w-px h-6 bg-border mx-1" role="separator" />

        <ActionButtons
          onExport={onExport}
          onImport={onImport}
          onOpenOptions={onOpenOptions}
          onOpenSettings={onOpenSettings}
          isOptionsPage={isOptionsPage}
        />
      </div>
    </header>
  );
};

export default Header;
