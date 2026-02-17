'use client';

import { FiSearch, FiX } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search users...",
  className = "",
  isMobile = false
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={`p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
          } ${searchQuery ? 'opacity-50' : ''}`} />

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full ${isMobile ? 'pl-9 pr-8 py-2 text-sm' : 'pl-10 pr-9 py-2.5 text-[15px]'
            } border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-black transition-all duration-200 ${isFocused ? 'bg-white dark:bg-zinc-950 shadow-sm' : ''
            }`}
          aria-label="Search"
        />

        {/* Clear Button (visible when there's text) */}
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors touch-target"
            aria-label="Clear search"
            type="button"
          >
            <FiX className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </button>
        )}

        {/* Keyboard shortcut hint for desktop */}
        {!isMobile && !searchQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:block">
            <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-300 dark:border-zinc-600">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Search result count/status (optional) */}
      {searchQuery && (
        <div className="mt-2 px-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Searching for: <span className="font-medium text-gray-700 dark:text-gray-300">"{searchQuery}"</span>
          </p>
        </div>
      )}
    </div>
  );
}
