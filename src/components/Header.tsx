import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import LockButton from "./LockButton";
import LockTimer from "./LockTimer";
import ActionButtons from "./ActionButtons";

interface HeaderProps {
  isOptionsPage: boolean;
  isLocked: boolean;
  timeLeft: string;
  onEnableLock: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenOptions?: () => void;
}

const Header = ({
  isOptionsPage,
  isLocked,
  timeLeft,
  onEnableLock,
  onExport,
  onImport,
  onOpenOptions,
}: HeaderProps) => {
  return (
    <div
      className={cn(
        "flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50 flex-col gap-6",
        {
          "mb-8 py-4 border-b border-slate-800": isOptionsPage,
        }
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <ShieldAlert
            className={`text-indigo-500 ${
              isOptionsPage ? "w-8 h-8" : "w-6 h-6"
            }`}
          />
        </div>
        <div>
          <h1
            className={`font-bold ${
              isOptionsPage
                ? "text-2xl text-slate-100"
                : "text-lg text-slate-100"
            }`}
          >
            {isLocked ? "Aegis Locked" : "Aegis Blocker"}
          </h1>
          {isOptionsPage && (
            <p className="text-slate-400 text-sm">
              {isLocked
                ? `Active Absolute Mode. Releases in: ${timeLeft}`
                : "Manage your restrictions."}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!isLocked && <LockButton onEnableLock={onEnableLock} />}
        {isLocked && <LockTimer timeLeft={timeLeft} />}

        <div className="w-px h-6 bg-slate-800 mx-1 self-center" />

        <ActionButtons
          onExport={onExport}
          onImport={onImport}
          onOpenOptions={onOpenOptions}
        />
      </div>
    </div>
  );
};

export default Header;
