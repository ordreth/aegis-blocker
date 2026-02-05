import { useEffect, useRef, useState } from "react";
import { exportRulesJSON, importRulesJSON, syncRules } from "./lib/rules";
import { cn, downloadJsonFile, readFileAsText } from "./lib/utils";
import Header from "./components/Header";
import AddRuleForm from "./components/AddRuleForm";
import RulesList from "./components/RulesList";
import QuickBlockButton from "./components/QuickBlockButton";
import { t } from "./lib/i18n";
import SettingsView from "./components/SettingsView";
import { useCurrentTab, useLockState, useRules, useSettings } from "./hooks";
import { ConfirmationDeleteModal } from "./components";

interface AppProps {
  isOptionsPage?: boolean;
}

export default function App({ isOptionsPage = false }: AppProps) {
  const [inputValue, setInputValue] = useState("");
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">(
    "dashboard",
  );
  const [ruleIdToDelete, setRuleIdToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isLocked, timeLeft, handleEnableLock } = useLockState();
  const { rules, isLoading, handleAdd, handleRemove, loadRules } = useRules();
  const { currentDomain, clearDomain } = useCurrentTab(isOptionsPage);
  const { settings, updateSetting } = useSettings();

  const handleRemoveRequest = async (id: number) => {
    if (isLocked) {
      alert(t("alert_action_blocked"));
      return;
    }

    if (settings.doubleCheckDelete) {
      setRuleIdToDelete(id);
    } else {
      await executeRemove(id);
    }
  };

  const executeRemove = async (id: number) => {
    try {
      await handleRemove(id);
      await loadRules();
      setRuleIdToDelete(null);
    } catch (error) {
      alert(t("alert_action_blocked"));
    }
  };

  const handleQuickBlock = async () => {
    if (!currentDomain) return;
    await handleAdd(currentDomain);
    clearDomain();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAdd(inputValue);
    setInputValue("");
  };

  const handleExport = async () => {
    const json = await exportRulesJSON();
    downloadJsonFile(json, "aegis-rules.json");
  };

  const handleImportClick = () => fileInputRef.current?.click();

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

  useEffect(() => {
    syncRules().catch(console.error);
  }, []);

  return (
    <main
      className={cn(
        "w-100 h-125 bg-background flex flex-col text-foreground font-sans animate-in fade-in slide-in-from-right-4 duration-300",
        {
          "w-full max-w-5xl mx-auto justify-start": isOptionsPage,
        },
      )}
    >
      <ConfirmationDeleteModal
        isOpen={!!ruleIdToDelete}
        onClose={() => setRuleIdToDelete(null)}
        onConfirm={() => ruleIdToDelete && executeRemove(ruleIdToDelete)}
      />
      {isOptionsPage && currentView === "settings" ? (
        <div className="flex-1 p-6">
          <SettingsView
            onBack={() => setCurrentView("dashboard")}
            settings={settings}
            updateSetting={updateSetting}
          />
        </div>
      ) : (
        <>
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
            onOpenSettings={() => setCurrentView("settings")}
          />

          <div
            className={cn("flex-1 overflow-hidden flex flex-col p-4 gap-4", {
              "bg-aegis-neutral-900/50 border border-border rounded-xl p-6 flex-none shadown-none z-auto container-size":
                isOptionsPage,
            })}
          >
            {!isOptionsPage && currentDomain && (
              <QuickBlockButton
                domain={currentDomain}
                onBlock={handleQuickBlock}
              />
            )}

            <AddRuleForm
              isOptionsPage={isOptionsPage}
              inputValue={inputValue}
              isLoading={isLoading}
              onInputChange={setInputValue}
              onSubmit={handleSubmit}
            />

            <RulesList
              isOptionsPage={isOptionsPage}
              rules={rules}
              isLocked={isLocked}
              onRemove={handleRemoveRequest}
            />
          </div>
        </>
      )}
    </main>
  );
}
