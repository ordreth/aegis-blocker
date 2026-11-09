import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAegis } from "./store";

export function RecoveryCodeDialog({
  code,
  upgrade,
  onClose,
}: {
  code: string | null;
  upgrade?: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!code} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} onInteractOutside={(e) => e.preventDefault()}>
        {code && <CodeBody code={code} upgrade={upgrade} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CodeBody({ code, upgrade, onClose }: { code: string; upgrade?: boolean; onClose: () => void }) {
  const { t } = useAegis();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => undefined);
    setCopied(true);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{upgrade ? t("upgrade_title") : t("recovery_saved_title")}</DialogTitle>
        <DialogDescription>{upgrade ? t("upgrade_desc") : t("recovery_saved_desc")}</DialogDescription>
      </DialogHeader>
      <div className="bg-muted flex items-center justify-between gap-3 rounded-lg px-4 py-3">
        <code className="text-primary text-lg font-semibold tracking-widest select-all">{code}</code>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={saved} onCheckedChange={(v) => setSaved(v === true)} />
        {t("recovery_saved_check")}
      </label>
      <DialogFooter>
        <Button disabled={!saved} onClick={onClose}>
          {t("done")}
        </Button>
      </DialogFooter>
    </>
  );
}
