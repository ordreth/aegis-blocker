import { Lock } from "lucide-react";
import { formatDuration } from "@/i18n";
import { useAegis, useNow } from "./store";

export function LockBanner() {
  const { t, state } = useAegis();
  const now = useNow(30_000);
  if (!state?.lockUntil || state.lockUntil <= now) return null;
  return (
    <div
      role="status"
      className="border-primary/30 bg-primary/10 text-primary flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
    >
      <Lock className="size-3.5" />
      <span>
        {t("lock_active")} · {t("lock_left", { time: formatDuration(state.lockUntil - now, t) })}
      </span>
    </div>
  );
}
