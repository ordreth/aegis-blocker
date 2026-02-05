import { useState, useEffect } from "react";

const useCurrentTab = (isOptionsPage: boolean) => {
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);

  useEffect(() => {
    if (isOptionsPage) return;

    const detectTab = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        const activeTab = tabs[0];
        if (!activeTab?.url) return;

        const urlObj = new URL(activeTab.url);
        if (
          urlObj.protocol === "chrome:" ||
          urlObj.protocol === "chrome-extension:"
        ) {
          return;
        }

        const cleanHostname = urlObj.hostname.replace(/^www\./, "");
        const path = urlObj.pathname;
        const search = urlObj.search;
        let fullUrl = cleanHostname + path + search;
        if (fullUrl.endsWith("/")) fullUrl = fullUrl.slice(0, -1);

        setCurrentDomain(fullUrl);
      } catch (error) {
        console.log(error);
      }
    };

    detectTab();
  }, [isOptionsPage]);

  const clearDomain = () => setCurrentDomain(null);

  return { currentDomain, clearDomain };
};
export default useCurrentTab;
