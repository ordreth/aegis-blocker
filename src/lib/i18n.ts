import { LOCALES } from "./locales";

export const setDevLocale = (locale: string | null) => {
  if (locale) {
    localStorage.setItem("aegis_dev_locale", locale);
  } else {
    localStorage.removeItem("aegis_dev_locale");
  }
  window.location.reload();
};

export const getCurrentLocale = () => {
  return localStorage.getItem("aegis_dev_locale") || "en (System)";
};

export const t = (key: string, placeholders?: string[]): string => {
  let locale = localStorage.getItem("aegis_dev_locale");

  if (!locale && (typeof chrome === "undefined" || !chrome.i18n)) {
    const browserLang = navigator.language.split("-")[0];
    if (LOCALES[browserLang]) {
      locale = browserLang;
    } else {
      locale = "en";
    }
  }

  if (locale && LOCALES[locale]) {
    const entry = LOCALES[locale][key];
    if (entry) {
      let msg = entry.message;
      if (placeholders) {
        placeholders.forEach((val, idx) => {
          msg = msg.replace(`$${idx + 1}`, val);
        });
        placeholders.forEach((val) => {
          msg = msg.replace("{domain}", val);
          msg = msg.replace("{pattern}", val);
        });
      }
      return msg;
    }
  }

  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getMessage(key, placeholders) || key;
  }

  return key;
};
