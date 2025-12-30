import React, { useEffect, useRef, useState } from "react";
import {
  Trash2,
  ShieldAlert,
  Plus,
  ExternalLink,
  Settings,
  Download,
  Upload,
  Unlock,
  Lock,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addRule,
  enableLock,
  exportRulesJSON,
  getLockState,
  getRules,
  importRulesJSON,
  removeRule,
  type BlockRule,
} from "@/lib/rules";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";

interface AppProps {
  isOptionsPage?: boolean;
}

export default function App({ isOptionsPage = false }: AppProps) {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    loadRules();
    checkLock();

    const interval = setInterval(() => {
      checkLock();
    }, 1000);

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
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    } else {
      setTimeLeft("");
    }
  };

  const handleEnableLock = async () => {
    await enableLock();
    await checkLock();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);
    try {
      const cleanUrl = inputValue
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");
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
      alert("You cannot remove rules during Absolute Mode.");
    }
  };

  const handleExport = async () => {
    const json = await exportRulesJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aegis-rules.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        try {
          await importRulesJSON(text);
          await loadRules();
          alert("Backup imported successfully!");
        } catch (error) {
          alert("Error importing file. Please verify that it is a valid JSON.");
        }
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL("options.html"));
  };

  const containerClass = isOptionsPage
    ? "w-full max-w-5xl mx-auto h-full flex flex-col"
    : "w-[400px] h-[500px] bg-slate-950 flex flex-col text-slate-100";

  const cardClass = isOptionsPage
    ? "bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex-1 shadow-sm"
    : "flex-1 overflow-hidden flex flex-col p-4 gap-4";

  return (
    <div className={containerClass}>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div
        className={`flex justify-between items-center ${
          isOptionsPage
            ? "mb-8 py-4 border-b border-slate-800"
            : "p-4 border-b border-slate-800 bg-slate-900/50 flex-col gap-6"
        }`}
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
          {!isLocked && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-700 hover:bg-slate-800 text-amber-500 hover:text-amber-400"
                  title="Activate Absolute Mode"
                >
                  <Unlock className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-500 flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Activate Absolute Mode?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    By activating this mode, you{" "}
                    <strong>will not be able to remove</strong> any existing
                    rules for the next <strong>24 hours</strong>.
                    <br />
                    <br />
                    You can still add new rules, but nothing can be undone until
                    the time runs out.
                    <br />
                    <br />
                    Are you sure you want to make this commitment?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEnableLock}
                    className="bg-red-600 hover:bg-red-700 text-white border-none"
                  >
                    Yes, Lock the Shield
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isLocked && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-900/50 bg-red-900/20 text-red-500 cursor-not-allowed hover:bg-red-900/20 font-mono text-xs w-28"
            >
              <Timer className="w-3 h-3 mr-2" />
              {timeLeft}
            </Button>
          )}

          <div className="w-px h-6 bg-slate-800 mx-1 self-center"></div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            title="Exportar Backup"
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <Download className="w-4 h-4 text-white" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleImportClick}
            title="Importar Backup"
            className="border-slate-700 hover:bg-slate-800 text-slate-300 "
          >
            <Upload className="w-4 h-4 text-white" />
          </Button>

          {!isOptionsPage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={openOptions}
              title="Expandir"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <div className={`flex gap-4 ${isOptionsPage ? "mb-8 max-w-xl" : ""}`}>
          <form onSubmit={handleAdd} className="flex gap-2 w-full">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: reddit.com/r/memes"
              className="bg-slate-950 border-slate-700 text-white flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </form>
        </div>

        <div
          className={`${
            isOptionsPage
              ? "bg-slate-950 rounded-lg border border-slate-800"
              : "flex-1 overflow-y-auto pr-2 space-y-2"
          }`}
        >
          {isOptionsPage && (
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 text-slate-400 text-sm font-medium">
              <div className="col-span-10">URL pattern</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
          )}

          <div
            className={
              isOptionsPage ? "divide-y divide-slate-800" : "space-y-2"
            }
          >
            {rules.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No active rules.</p>
                <p className="text-xs mt-1 opacity-50">
                  Your browsing is now completely unrestricted.
                </p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={
                    isOptionsPage
                      ? "grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-900/50 transition-colors group"
                      : "flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded group hover:border-slate-600 transition-colors"
                  }
                >
                  <div
                    className={isOptionsPage ? "col-span-10" : "flex-1 min-w-0"}
                  >
                    <span className="font-mono text-sm text-slate-300 truncate block">
                      {rule.urlPattern}
                    </span>
                  </div>

                  <div className={isOptionsPage ? "col-span-2 text-right" : ""}>
                    {!isLocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleRemove(rule.id);
                        }}
                        className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {isOptionsPage ? (
                          "Remover"
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {isLocked && (
                      <Lock className="w-4 h-4 text-slate-700 ml-auto" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
