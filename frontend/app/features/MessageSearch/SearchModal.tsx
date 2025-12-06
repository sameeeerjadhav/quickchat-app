// app/chat/features/MessageSearch/SearchModal.tsx
import React, { useState, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';

interface SearchResult {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  isOwn: boolean;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SearchResult[];
  onSearch: (query: string) => SearchResult[];
  onNavigateToMessage: (messageId: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSearch,
  onNavigateToMessage
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = onSearch(query);
      setResults(searchResults);
      setCurrentIndex(0);
    } else {
      setResults([]);
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateResult('prev');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateResult('next');
    }
    if (e.key === 'Enter' && results.length > 0) {
      onNavigateToMessage(results[currentIndex].id);
      onClose();
    }
  };

  const navigateResult = (direction: 'next' | 'prev') => {
    if (results.length === 0) return;

    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % results.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Search Messages</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for messages..."
                className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              
              {results.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {currentIndex + 1} of {results.length}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => navigateResult('prev')}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={results.length === 0 || currentIndex === 0}
                    >
                      <ChevronUp size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => navigateResult('next')}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={results.length === 0 || currentIndex === results.length - 1}
                    >
                      <ChevronDown size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No messages found for "{query}"</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onNavigateToMessage(result.id);
                      onClose();
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      index === currentIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          result.isOwn ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {result.isOwn ? 'You' : result.senderName}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {formatDate(result.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {highlightMatches(result.text, query)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Enter a search term to find messages</p>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  Found {results.length} message{results.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd>
                    <span>Go to</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const highlightMatches = (text: string, query: string) => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default SearchModal;