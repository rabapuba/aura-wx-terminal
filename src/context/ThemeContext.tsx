import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = window.localStorage.getItem('theme');
        if (savedTheme === 'dark') return 'dark';
        if (savedTheme === 'lite' || savedTheme === 'light') return 'light';

        const stored = window.localStorage.getItem('aura_wx_theme') as Theme | null;
        if (stored === 'dark' || stored === 'light') return stored;
      }
    } catch (e) {
      console.warn('localStorage access restricted:', e);
    }
    return 'dark'; // Default to institutional dark mode
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme', isDark ? 'dark' : 'lite');
        window.localStorage.setItem('aura_wx_theme', theme);
      }
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  }, [theme, isDark]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
