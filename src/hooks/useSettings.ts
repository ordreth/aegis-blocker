import { useState, useEffect } from "react";

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

const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSettings = async () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.get(["aegis_settings"], (result) => {
          if (result.aegis_settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...result.aegis_settings });
          }
          setLoading(false);
        });
      } else {
        const local = localStorage.getItem("aegis_settings");
        if (local) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(local) });
        }
        setLoading(false);
      }
    };
    initializeSettings();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

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

    if (key === "language") applyLanguage(value as string);
  };

  return { settings, updateSetting, loading };
};

function applyLanguage(lang: string) {
  if (lang === "system") {
    localStorage.removeItem("aegis_dev_locale");
  } else {
    localStorage.setItem("aegis_dev_locale", lang);
  }
  window.location.reload();
}

export default useSettings;
