import { useState, useEffect } from "react";
import { addRule, removeRule, getRules, type BlockRule } from "../lib/rules";
import { isValidPattern, sanitizeUrl } from "../lib/utils";
import { t } from "../lib/i18n";

const useRules = () => {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const loaded = await getRules();
      setRules(loaded);
    } catch (error) {
      console.error("Failed to load rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleAdd = async (value: string) => {
    if (!value.trim()) return;

    if (!isValidPattern(value)) {
      alert(t("alert_invalid_pattern"));
      return;
    }

    setIsLoading(true);
    try {
      const cleanUrl = sanitizeUrl(value);
      await addRule(cleanUrl);
      await loadRules();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeRule(id);
      await loadRules();
    } catch {
      alert(t("alert_action_blocked"));
    }
  };

  return { rules, isLoading, handleAdd, handleRemove, loadRules };
};

export default useRules;
