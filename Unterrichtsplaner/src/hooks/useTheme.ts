import { useState, useEffect } from 'react';

/** v3.89 L7: Light-/Darkmode Toggle — persistiert via localStorage */
export function useTheme() {
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  return { isLight, toggleTheme: () => setIsLight(prev => !prev) };
}
