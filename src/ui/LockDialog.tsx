import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDuration } from "@/i18n";
import { Segmented } from "./primitives";
import { useAegis } from "./store";

export const LOCK_PRESETS = [1, 4, 12, 24, 72, 168, 720];

export function LockDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LockForm onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so the duration starts from the saved default each time. */
function LockForm({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const { t, run, state } = useAegis();
  const [hours, setHours] = useState(state?.settings.lockHours ?? 24);
  const duration = formatDuration(hours * 3_600_000, t);
  const options = [...new Set([...LOCK_PRESETS, hours])].sort((a, b) => a - b);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Lock className="text-primary size-5" /> {t("lock_confirm_title")}
        </DialogTitle>
        <DialogDescription>{t("lock_confirm_desc", { duration })}</DialogDescription>
      </DialogHeader>
      <Segmented
        label={t("lock_duration")}
        value={String(hours)}
        onChange={(v) => setHours(Number(v))}
        options={options.map((h) => ({ value: String(h), label: formatDuration(h * 3_600_000, t) }))}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">{t("lock_note")}</p>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button
          onClick={async () => {
            if (await run({ t: "lock.enable", hours })) onOpenChange(false);
          }}
        >
          <Lock /> {t("lock_confirm", { duration })}
        </Button>
      </DialogFooter>
    </>
  );
}
