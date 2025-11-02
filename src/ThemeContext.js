import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from './theme';

const ThemeCtx = createContext({ theme: darkTheme, mode: 'dark', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'dark');
  useEffect(() => { localStorage.setItem('mode', mode); }, [mode]);
  const value = useMemo(() => ({ theme: mode === 'dark' ? darkTheme : lightTheme, mode, toggle: () => setMode(m => (m === 'dark' ? 'light' : 'dark')) }), [mode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}


