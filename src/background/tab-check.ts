export const TAB_CHECK_INTERVAL_MS = 1000;

/**
 * Paces the check that follows a tab's title or address change: at most one
 * evaluation per tab per interval. The first change is checked at once; changes
 * arriving during the interval are answered by a single check when it ends,
 * against whatever the tab shows by then. A page rewriting its title or URL in a
 * loop cannot keep the worker busy (or test guesses against the rules any faster
 * than one per interval), and a real navigation is never checked more than one
 * interval late.
 */
export function createTabPacer(check: (tabId: number) => void, interval = TAB_CHECK_INTERVAL_MS) {
  const open = new Map<number, { timer: ReturnType<typeof setTimeout>; again: boolean }>();

  const start = (tabId: number) => {
    const slot = {
      again: false,
      timer: setTimeout(() => {
        open.delete(tabId);
        if (!slot.again) return;
        start(tabId);
        check(tabId);
      }, interval),
    };
    open.set(tabId, slot);
  };

  return {
    changed(tabId: number): void {
      const slot = open.get(tabId);
      if (slot) {
        slot.again = true;
        return;
      }
      start(tabId);
      check(tabId);
    },
    closed(tabId: number): void {
      const slot = open.get(tabId);
      if (slot) clearTimeout(slot.timer);
      open.delete(tabId);
    },
  };
}
