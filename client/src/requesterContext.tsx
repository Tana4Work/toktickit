import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DevelopmentRequester } from "./api.js";

interface RequesterContextValue {
  currentRequester: DevelopmentRequester | null;
  selectRequester: (requester: DevelopmentRequester) => void;
  clearRequester: () => void;
}

const RequesterContext = createContext<RequesterContextValue>({
  currentRequester: null,
  selectRequester: () => undefined,
  clearRequester: () => undefined,
});

export function RequesterProvider({ children }: { children: ReactNode }) {
  const [currentRequester, setCurrentRequester] = useState<DevelopmentRequester | null>(null);
  const value = useMemo(() => ({
    currentRequester,
    selectRequester: setCurrentRequester,
    clearRequester: () => setCurrentRequester(null),
  }), [currentRequester]);

  return <RequesterContext.Provider value={value}>{children}</RequesterContext.Provider>;
}

export function useRequester() {
  return useContext(RequesterContext);
}
