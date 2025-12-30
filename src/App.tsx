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
import QuickBlockButton from "./components/ui/QuickBlockButton";

interface AppProps {
  isOptionsPage?: boolean;
}

const LOCK_CHECK_INTERVAL = 1000;

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

        const domain = urlObj.hostname.replace(/^www\./, "");
        setCurrentDomain(domain);
      }
    } catch (e) {
      console.log("Could not detect tab (dev mode?)");
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
      console.error("Failed to quick block:", error);
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
      alert(
        "For security reasons, the template should have at least 4 letters and include a period (e.g., site.com)"
      );
      return;
    }

    setIsLoading(true);
    try {
      const cleanUrl = sanitizeUrl(inputValue);
      await addRule(cleanUrl);
      setInputValue("");
      await loadRules();
    } catch (error) {
      console.error("Failed to add rule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeRule(id);
      await loadRules();
    } catch (error) {
      alert("You cannot remove rules during Absolute Mode.");
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
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      await importRulesJSON(text);
      await loadRules();
      alert("Backup imported successfully!");
    } catch (error) {
      alert("Error importing file. Please verify that it is a valid JSON.");
    } finally {
      event.target.value = "";
    }
  };

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  return (
    <div
      className={cn("w-100 h-125 bg-slate-950 flex flex-col text-slate-100", {
        "w-full max-w-5xl mx-auto h-full flex flex-col": isOptionsPage,
      })}
    >
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

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
          "bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex-1 shadow-sm":
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
    </div>
  );
}
