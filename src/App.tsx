import { useEffect, useRef, useState } from "react";
import {
  addRule,
  enableLock,
  exportRulesJSON,
  getLockState,
  getRules,
  importRulesJSON,
  removeRule,
  type BlockRule,
} from "./lib/rules";
import {
  cn,
  downloadJsonFile,
  formatTimeRemaining,
  isValidPattern,
  readFileAsText,
  sanitizeUrl,
} from "./lib/utils";
import Header from "./components/Header";
import AddRuleForm from "./components/AddRuleForm";
import RulesList from "./components/RulesList";
import QuickBlockButton from "./components/QuickBlockButton";
import { getCurrentLocale, setDevLocale, t } from "./lib/i18n";

interface AppProps {
  isOptionsPage?: boolean;
}

const LOCK_CHECK_INTERVAL = 1000;

const DevLanguageSwitcher = () => {
  const isDev = true;

  if (!isDev) return null;

  const current = getCurrentLocale();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur text-white p-1 text-xs flex justify-center gap-2 z-50 border-t border-white/10">
      <span className="opacity-50 self-center mr-2">Dev Locales:</span>

      <button
        onClick={() => setDevLocale(null)}
        className={`px-2 py-1 rounded hover:bg-white/20 ${current.includes("System") ? "bg-primary text-black" : ""}`}
      >
        System (EN)
      </button>

      <button
        onClick={() => setDevLocale("pt")}
        className={`px-2 py-1 rounded hover:bg-white/20 ${current === "pt" ? "bg-primary text-black" : ""}`}
      >
        PT
      </button>

      <button
        onClick={() => setDevLocale("es")}
        className={`px-2 py-1 rounded hover:bg-white/20 ${current === "es" ? "bg-primary text-black" : ""}`}
      >
        ES
      </button>

      <button
        onClick={() => setDevLocale("de")}
        className={`px-2 py-1 rounded hover:bg-white/20 ${current === "de" ? "bg-primary text-black" : ""}`}
      >
        DE
      </button>

      <button
        onClick={() => setDevLocale("zn_CH")}
        className={`px-2 py-1 rounded hover:bg-white/20 ${current === "zn_CH" ? "bg-primary text-black" : ""}`}
      >
        zn_CH
      </button>
    </div>
  );
};

export default function App({ isOptionsPage = false }: AppProps) {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRules();
    checkLock();
    detectCurrentTab();
    const interval = setInterval(checkLock, LOCK_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const loadRules = async () => {
    const loaded = await getRules();
    setRules(loaded);
  };

  const checkLock = async () => {
    const state = await getLockState();
    setIsLocked(state.isLocked);
    if (state.isLocked && state.unlockAt) {
      const diff = state.unlockAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("");
        setIsLocked(false);
      } else {
        setTimeLeft(formatTimeRemaining(diff));
      }
    } else {
      setTimeLeft("");
    }
  };

  const detectCurrentTab = async () => {
    if (isOptionsPage) return;
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      if (activeTab && activeTab.url) {
        const urlObj = new URL(activeTab.url);
        if (
          urlObj.protocol === "chrome:" ||
          urlObj.protocol === "chrome-extension:"
        )
          return;

        const cleanHostname = urlObj.hostname.replace(/^www\./, "");
        const path = urlObj.pathname;
        const search = urlObj.search;
        let fullUrl = cleanHostname + path + search;
        if (fullUrl.endsWith("/")) fullUrl = fullUrl.slice(0, -1);

        setCurrentDomain(fullUrl);
      }
    } catch (e) {
      console.log("Could not detect tab");
    }
  };

  const handleQuickBlock = async () => {
    if (!currentDomain) return;
    setIsLoading(true);
    try {
      await addRule(currentDomain);
      setCurrentDomain(null);
      await loadRules();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableLock = async () => {
    await enableLock();
    await checkLock();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!isValidPattern(inputValue)) {
      alert(t("alert_invalid_pattern"));
      return;
    }
    setIsLoading(true);
    try {
      const cleanUrl = sanitizeUrl(inputValue);
      await addRule(cleanUrl);
      setInputValue("");
      await loadRules();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeRule(id);
      await loadRules();
    } catch (error) {
      alert(t("alert_action_blocked"));
    }
  };

  const handleExport = async () => {
    const json = await exportRulesJSON();
    downloadJsonFile(json, "aegis-rules.json");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      await importRulesJSON(text);
      await loadRules();
      alert(t("alert_import_success"));
    } catch (error) {
      alert(t("alert_import_error"));
    } finally {
      event.target.value = "";
    }
  };

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL("options.html"));
  };

  return (
    <main
      className={cn(
        "w-100 h-125 bg-background flex flex-col text-foreground font-sans",
        {
          "w-full max-w-5xl mx-auto justify-start": isOptionsPage,
        },
      )}
    >
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <DevLanguageSwitcher />
      <Header
        isOptionsPage={isOptionsPage}
        isLocked={isLocked}
        timeLeft={timeLeft}
        onEnableLock={handleEnableLock}
        onExport={handleExport}
        onImport={handleImportClick}
        onOpenOptions={!isOptionsPage ? openOptions : undefined}
      />

      <div
        className={cn("flex-1 overflow-hidden flex flex-col p-4 gap-4", {
          "bg-aegis-neutral-900/50 border border-border rounded-xl p-6 flex-none shadown-none z-auto container-size":
            isOptionsPage,
        })}
      >
        {!isOptionsPage && currentDomain && (
          <QuickBlockButton domain={currentDomain} onBlock={handleQuickBlock} />
        )}

        <AddRuleForm
          isOptionsPage={isOptionsPage}
          inputValue={inputValue}
          isLoading={isLoading}
          onInputChange={setInputValue}
          onSubmit={handleAdd}
        />

        <RulesList
          isOptionsPage={isOptionsPage}
          rules={rules}
          isLocked={isLocked}
          onRemove={handleRemove}
        />
      </div>
    </main>
  );
}
