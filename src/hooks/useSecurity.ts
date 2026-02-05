import { useState, useEffect } from "react";
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateRecoveryCode,
} from "@/lib/crypto";

export interface SecurityConfig {
  isEnabled: boolean;
  passwordHash: string | null;
  salt: string | null;
  recoveryHash: string | null;
}

const SECURITY_KEY = "aegis_security_config";
const SESSION_KEY = "aegis_auth_session";
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

function useSecurity() {
  const [config, setConfig] = useState<SecurityConfig>({
    isEnabled: false,
    passwordHash: null,
    salt: null,
    recoveryHash: null,
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateSession = (timestamp?: number) => {
    if (timestamp && Date.now() - timestamp < SESSION_TIMEOUT_MS) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const stored = await chrome.storage.sync.get(SECURITY_KEY);
      const currentConfig = stored[SECURITY_KEY] as SecurityConfig;

      if (currentConfig && currentConfig.isEnabled) {
        setConfig(currentConfig);

        const session = await chrome.storage.session.get(SESSION_KEY);
        validateSession(session[SESSION_KEY] as number | undefined);
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    init();

    const handleChanges = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "sync" && changes[SECURITY_KEY]) {
        const newConfig = changes[SECURITY_KEY].newValue as SecurityConfig;
        setConfig(newConfig);
        if (!newConfig?.isEnabled) setIsAuthenticated(true);
      }

      if (areaName === "session" && changes[SESSION_KEY]) {
        validateSession(changes[SESSION_KEY].newValue as number | undefined);
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.onChanged.addListener(handleChanges);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleChanges);
      }
    };
  }, []);

  const login = async (password: string): Promise<boolean> => {
    if (!config.passwordHash || !config.salt) return false;

    const isValid = await verifyPassword(
      password,
      config.passwordHash,
      config.salt,
    );

    if (isValid) {
      setIsAuthenticated(true);
      await chrome.storage.session.set({ [SESSION_KEY]: Date.now() });
      return true;
    }
    return false;
  };

  const setupPassword = async (password: string): Promise<string> => {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const recoveryCode = generateRecoveryCode();
    const recoveryHash = await hashPassword(recoveryCode, salt);

    const newConfig: SecurityConfig = {
      isEnabled: true,
      passwordHash,
      salt,
      recoveryHash,
    };

    setConfig(newConfig);
    setIsAuthenticated(true);

    await chrome.storage.sync.set({ [SECURITY_KEY]: newConfig });
    await chrome.storage.session.set({ [SESSION_KEY]: Date.now() });

    return recoveryCode;
  };

  const recoverAccount = async (inputCode: string): Promise<boolean> => {
    if (!config.recoveryHash || !config.salt) return false;
    const isValid = await verifyPassword(
      inputCode,
      config.recoveryHash,
      config.salt,
    );

    if (isValid) {
      await chrome.storage.sync.remove(SECURITY_KEY);
      setConfig({
        isEnabled: false,
        passwordHash: null,
        salt: null,
        recoveryHash: null,
      });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  return {
    isLoading,
    isSecurityEnabled: config.isEnabled,
    isAuthenticated,
    login,
    setupPassword,
    recoverAccount,
  };
}
export default useSecurity;
