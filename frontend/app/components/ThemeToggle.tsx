'use client';

import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-zinc-900 opacity-0">
        <FiSun className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 touch-target relative group"
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolvedTheme === 'light' ? (
        <FiMoon className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-active:scale-95" />
      ) : (
        <FiSun className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-active:scale-95" />
      )}

      {/* Tooltip for desktop */}
      <span className="hidden sm:block absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-zinc-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
}
