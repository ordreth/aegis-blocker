export interface BlockRule {
  id: number;
  urlPattern: string;
  matchType: "contains" | "exact";
  createdAt: number;
}

export interface LockState {
  isLocked: boolean;
  unlockAt: number | null;
}

const STORAGE_KEY = "block_rules";
const LOCK_KEY = "aegis_lock_state";

const getBlockedPageUrl = () => chrome.runtime.getURL("blocked.html");

export async function getRules(): Promise<BlockRule[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as BlockRule[]) || [];
}

export async function getLockState(): Promise<LockState> {
  const result = await chrome.storage.local.get(LOCK_KEY);
  const state = (result[LOCK_KEY] as LockState) || {
    isLocked: false,
    unlockAt: null,
  };

  if (state.isLocked && state.unlockAt && Date.now() > state.unlockAt) {
    const newState = { isLocked: false, unlockAt: null };
    await chrome.storage.local.set({ [LOCK_KEY]: newState });
    return newState;
  }

  return state;
}

export async function enableLock(): Promise<void> {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const unlockAt = Date.now() + twentyFourHours;
  const newState: LockState = { isLocked: true, unlockAt };
  await chrome.storage.local.set({ [LOCK_KEY]: newState });
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
  const lockState = await getLockState();
  if (lockState.isLocked) {
    throw new Error("ACTION BLOCKED: Absolute Mode is active.");
  }

  const rules = await getRules();
  const updatedRules = rules.filter((r) => r.id !== id);

  await chrome.storage.local.set({ [STORAGE_KEY]: updatedRules });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [id],
  });
}

export async function exportRulesJSON(): Promise<string> {
  const rules = await getRules();
  const exportData = rules.map(({ urlPattern, matchType }) => ({
    urlPattern,
    matchType,
  }));
  return JSON.stringify(exportData, null, 2);
}

export async function importRulesJSON(jsonString: string): Promise<void> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed))
      throw new Error("Invalid format: An array is expected.");

    const currentRules = await getRules();
    const currentPatterns = new Set(currentRules.map((r) => r.urlPattern));

    const newItems = parsed.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) =>
        item.urlPattern &&
        typeof item.urlPattern === "string" &&
        !currentPatterns.has(item.urlPattern)
    );

    if (newItems.length === 0) return;

    let nextId =
      currentRules.length > 0
        ? Math.max(...currentRules.map((r) => r.id)) + 1
        : 1;

    const newRules: BlockRule[] = newItems.map((item) => ({
      id: nextId++,
      urlPattern: item.urlPattern,
      matchType: item.matchType || "contains",
      createdAt: Date.now(),
    }));

    const updatedRules = [...currentRules, ...newRules];
    await chrome.storage.local.set({ [STORAGE_KEY]: updatedRules });

    const dnrRules = newRules.map((r) => ({
      id: r.id,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { url: getBlockedPageUrl() },
      },
      condition: {
        urlFilter: `*${r.urlPattern}*`,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: dnrRules,
    });
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}
