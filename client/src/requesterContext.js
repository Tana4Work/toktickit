import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from "react";
const RequesterContext = createContext({
    currentRequester: null,
    selectRequester: () => undefined,
    clearRequester: () => undefined,
});
export function RequesterProvider({ children }) {
    const [currentRequester, setCurrentRequester] = useState(null);
    const value = useMemo(() => ({
        currentRequester,
        selectRequester: setCurrentRequester,
        clearRequester: () => setCurrentRequester(null),
    }), [currentRequester]);
    return _jsx(RequesterContext.Provider, { value: value, children: children });
}
export function useRequester() {
    return useContext(RequesterContext);
}
