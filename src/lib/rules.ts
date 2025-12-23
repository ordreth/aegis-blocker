export interface BlockRule {
  id: number;
  urlPattern: string;
  matchType: "contains" | "exact";
  createdAt: number;
}

const STORAGE_KEY = "block_rules";

const getBlockedPageUrl = () => chrome.runtime.getURL("blocked.html");

export async function getRules(): Promise<BlockRule[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as BlockRule[]) || [];
}

export async function addRule(pattern: string): Promise<void> {
  const rules = await getRules();

  const newId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;

  const newRule: BlockRule = {
    id: newId,
    urlPattern: pattern,
    matchType: "contains",
    createdAt: Date.now(),
  };

  const updatedRules = [...rules, newRule];
  await chrome.storage.local.set({ [STORAGE_KEY]: updatedRules });

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: newId,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: getBlockedPageUrl() },
        },
        condition: {
          urlFilter: `*${pattern}*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
    ],
    removeRuleIds: [newId],
  });
}

export async function removeRule(id: number): Promise<void> {
  const rules = await getRules();
  const updatedRules = rules.filter((r) => r.id !== id);

  await chrome.storage.local.set({ [STORAGE_KEY]: updatedRules });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [id],
  });
}
