import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createT, resolveLocale, type MessageKey, type TFunction } from "@/i18n";
import { AegisError, type Request, type ResponseMap } from "@/shared/messages";
import type { AppState, ErrorCode, Locale } from "@/shared/types";
import { send } from "./client";

type ToastKind = "ok" | "error";
interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

interface Ctx {
  state: AppState | null;
  t: TFunction;
  locale: Locale;
  locked: boolean;
  refresh: () => Promise<void>;
  /** Sends a request; shows a toast on failure and returns undefined. */
  run: <K extends Request["t"]>(
    req: Extract<Request, { t: K }>,
    okMessage?: MessageKey,
  ) => Promise<ResponseMap[K] | undefined>;
  toast: (text: string, kind?: ToastKind) => void;
  errorText: (code: ErrorCode) => string;
}

const AegisContext = createContext<Ctx | null>(null);

export function useAegis(): Ctx {
  const ctx = useContext(AegisContext);
  if (!ctx) throw new Error("AegisProvider missing");
  return ctx;
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function applyTheme(pref: AppState["settings"]["theme"]) {
  const dark =
    pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function AegisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    try {
      setState(await send({ t: "state" }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // Subscribes to an external system (extension storage); state is set after the async read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = (_: unknown, area: string) => {
      if (area !== "local" && area !== "session") return;
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 60);
    };
    chrome.storage.onChanged.addListener(onChange);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
      window.removeEventListener("focus", onFocus);
      clearTimeout(timer);
    };
  }, [refresh]);

  const settings = state?.settings;
  useEffect(() => {
    applyTheme(settings?.theme ?? "dark");
    if (settings?.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [settings?.theme]);

  const locale = resolveLocale(settings?.language ?? "system");
  const t = useMemo(() => createT(locale), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  }, [locale]);

  const toast = useCallback((text: string, kind: ToastKind = "ok") => {
    const id = ++seq.current;
    setToasts((l) => [...l.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), kind === "error" ? 6000 : 2500);
  }, []);

  const errorText = useCallback((code: ErrorCode) => t(`err_${code}` as MessageKey), [t]);

  const run: Ctx["run"] = useCallback(
    async (req, okMessage) => {
      try {
        const res = await send(req);
        if (okMessage) toast(t(okMessage));
        await refresh();
        return res;
      } catch (e) {
        const code = e instanceof AegisError ? e.code : "internal";
        toast(errorText(code), "error");
        if (code === "auth_required" || code === "locked") await refresh();
        return undefined;
      }
    },
    [errorText, refresh, t, toast],
  );

  const now = useNow(10_000);
  const locked = !!state?.lockUntil && state.lockUntil > now;

  const value = useMemo<Ctx>(
    () => ({
      state,
      t,
      locale,
      locked,
      refresh,
      run,
      toast,
      errorText,
    }),
    [state, t, locale, locked, refresh, run, toast, errorText],
  );

  return (
    <AegisContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-3 z-100 flex flex-col items-center gap-2 px-3"
        role="status"
        aria-live="polite"
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            className={
              "animate-in fade-in slide-in-from-bottom-2 pointer-events-auto max-w-sm rounded-lg border px-3 py-2 text-sm shadow-lg " +
              (x.kind === "error"
                ? "border-red-500/40 bg-red-950 text-red-100"
                : "border-border bg-card text-card-foreground")
            }
          >
            {x.text}
          </div>
        ))}
      </div>
    </AegisContext.Provider>
  );
}
