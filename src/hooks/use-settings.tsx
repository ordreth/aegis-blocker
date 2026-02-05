import { useState, useEffect } from "react";

// Tipagem das configurações
export interface AppSettings {
  theme: "system" | "dark" | "light";
  language: "system" | "pt" | "en" | "es" | "de" | "zh_CN";
  doubleCheckDelete: boolean;
  absoluteModeDurationHours: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  language: "system",
  doubleCheckDelete: true,
  absoluteModeDurationHours: 24,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["aegis_settings"], (result) => {
        if (result.aegis_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...result.aegis_settings });
        }
        setLoading(false);
      });
    } else {
      const local = localStorage.getItem("aegis_settings");
      if (local) setSettings(JSON.parse(local));
      setLoading(false);
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ aegis_settings: newSettings });
    } else {
      localStorage.setItem("aegis_settings", JSON.stringify(newSettings));
    }

    if (key === "theme") applyTheme(value as string);
    if (key === "language") applyLanguage(value as string);
  };

  return { settings, updateSetting, loading };
}

function applyTheme(theme: string) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

function applyLanguage(lang: string) {
  if (lang === "system") {
    localStorage.removeItem("aegis_dev_locale");
  } else {
    localStorage.setItem("aegis_dev_locale", lang);
  }
  window.location.reload();
}
