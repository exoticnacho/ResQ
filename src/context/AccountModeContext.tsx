"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AccountMode = "consumer" | "merchant" | "kurir";

interface AccountModeContextProps {
  mode: AccountMode;
  switchMode: (mode: AccountMode) => void;
  isConsumer: boolean;
  isMerchant: boolean;
  isCourier: boolean;
}

const AccountModeContext = createContext<AccountModeContextProps>({
  mode: "consumer",
  switchMode: () => {},
  isConsumer: true,
  isMerchant: false,
  isCourier: false,
});

export const AccountModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AccountMode>("consumer");

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("resq_account_mode") as AccountMode | null;
    if (saved === "merchant" || saved === "consumer" || saved === "kurir") {
      setMode(saved);
    }
  }, []);

  const switchMode = useCallback((newMode: AccountMode) => {
    setMode(newMode);
    localStorage.setItem("resq_account_mode", newMode);
  }, []);

  return (
    <AccountModeContext.Provider
      value={{
        mode,
        switchMode,
        isConsumer: mode === "consumer",
        isMerchant: mode === "merchant",
        isCourier: mode === "kurir",
      }}
    >
      {children}
    </AccountModeContext.Provider>
  );
};

export const useAccountMode = () => useContext(AccountModeContext);
