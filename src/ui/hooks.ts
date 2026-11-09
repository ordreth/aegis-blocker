import { useEffect, useState } from "react";
import { hostOf } from "@/shared/patterns";

export interface CurrentSite {
  host: string;
  /** Normalised `host/path` (no trailing slash) or null when on the site root. */
  path: string | null;
}

/** The site of the active tab, if it is http(s). Host permissions expose the URL; nothing else is read. */
export function useCurrentSite(): CurrentSite | null {
  const [site, setSite] = useState<CurrentSite | null>(null);
  useEffect(() => {
    let alive = true;
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        const host = hostOf(tab?.url);
        if (!alive || !host || !tab?.url) return;
        const pathname = new URL(tab.url).pathname.replace(/\/+$/, "");
        setSite({ host, path: pathname ? `${host}${pathname.toLowerCase()}` : null });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return site;
}
