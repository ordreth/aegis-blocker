import React, { useEffect, useState } from "react";
import {
  Trash2,
  ShieldAlert,
  Plus,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addRule, getRules, removeRule, type BlockRule } from "@/lib/rules";

interface AppProps {
  isOptionsPage?: boolean;
}

export default function App({ isOptionsPage = false }: AppProps) {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const loaded = await getRules();
    setRules(loaded);
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
      <div
        className={`flex justify-between items-center ${
          isOptionsPage
            ? "mb-8 py-4 border-b border-slate-800"
            : "p-4 border-b border-slate-800 bg-slate-900/50"
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
              Aegis Block
            </h1>
            {isOptionsPage && (
              <p className="text-slate-400 text-sm">
                Manage your browsing restrictions.
              </p>
            )}
          </div>
        </div>

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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeRule(rule.id).then(loadRules);
                      }}
                      className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {isOptionsPage ? (
                        "Remove"
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
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
