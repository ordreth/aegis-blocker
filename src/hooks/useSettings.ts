import { useState, useEffect } from "react";

export interface AppSettings {
  theme: "system" | "dark" | "light";
  language: "system" | "pt" | "en" | "es" | "de" | "zh_CN";
  doubleCheckDelete: boolean;
  absoluteModeDurationHours: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "en",
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
            const remoteSettings = result.aegis_settings as AppSettings;
            setSettings({ ...DEFAULT_SETTINGS, ...remoteSettings });
            if (remoteSettings.theme) {
              localStorage.setItem("vite-ui-theme", remoteSettings.theme);
            }
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

    if (key === "theme") {
      localStorage.setItem("vite-ui-theme", value as string);
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
