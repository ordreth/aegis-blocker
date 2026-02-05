import { useState, useEffect, useCallback } from "react";
import { getLockState, enableLock } from "../lib/rules";
import { formatTimeRemaining } from "../lib/utils";
import { LOCK_CHECK_INTERVAL } from "../constants";

type LockSnapshot = {
  isLocked: boolean;
  timeLeft: string;
};

const useLockState = () => {
  const [lock, setLock] = useState<LockSnapshot>({
    isLocked: false,
    timeLeft: "",
  });

  const checkLock = useCallback(async () => {
    const state = await getLockState();

    setLock((prev) => {
      if (!state.isLocked || !state.unlockAt) {
        if (!prev.isLocked) return prev;
        return { isLocked: false, timeLeft: "" };
      }

      const diff = state.unlockAt - Date.now();
      if (diff <= 0) {
        if (!prev.isLocked) return prev;
        return { isLocked: false, timeLeft: "" };
      }

      const newTimeLeft = formatTimeRemaining(diff);
      if (prev.isLocked && prev.timeLeft === newTimeLeft) {
        return prev;
      }

      return {
        isLocked: true,
        timeLeft: newTimeLeft,
      };
    });
  }, []);

  const handleEnableLock = async () => {
    await enableLock();
    await checkLock();
  };

  useEffect(() => {
    const timer = setTimeout(() => checkLock(), 0);

    const interval = setInterval(checkLock, LOCK_CHECK_INTERVAL);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkLock]);

  return {
    isLocked: lock.isLocked,
    timeLeft: lock.timeLeft,
    handleEnableLock,
  };
};

export default useLockState;
