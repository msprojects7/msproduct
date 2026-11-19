'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const effectiveTheme = isMounted ? theme : 'dark';

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
        effectiveTheme === 'dark'
          ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 bg-slate-900/60 border border-slate-700/60 shadow-sm'
          : 'text-indigo-600 hover:text-indigo-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-sm'
      } ${className}`}
    >
      {effectiveTheme === 'dark' ? (
        <Sun className={`${iconSize} hover:rotate-45 transition-transform duration-300`} />
      ) : (
        <Moon className={`${iconSize} hover:-rotate-12 transition-transform duration-300`} />
      )}
    </button>
  );
}

export default ThemeToggle;
