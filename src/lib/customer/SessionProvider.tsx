"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "customer_session";

export type CustomerSession = {
  name: string;
  whatsapp: string;
  tableNumber: string;
};

type SessionContextValue = {
  session: CustomerSession | null;
  setSession: (session: CustomerSession) => void;
  clearSession: () => void;
  hydrated: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function CustomerSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<CustomerSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Hydrating client-only sessionStorage after mount to avoid an
        // SSR/CSR mismatch — see LocaleProvider for the same rationale.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessionState(JSON.parse(raw));
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const setSession = (next: CustomerSession) => {
    setSessionState(next);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearSession = () => {
    setSessionState(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SessionContext.Provider value={{ session, setSession, clearSession, hydrated }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useCustomerSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useCustomerSession must be used within CustomerSessionProvider");
  return ctx;
}
