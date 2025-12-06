// app/chat/features/MessageSearch/useMessageSearch.ts
import { useState, useCallback } from 'react';

interface SearchMessage {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  isOwn: boolean;
}

export const useMessageSearch = (messages: SearchMessage[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMessage[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const performSearch = useCallback((query: string): SearchMessage[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return messages.filter(message => 
      message.text.toLowerCase().includes(lowerQuery) ||
      message.senderName.toLowerCase().includes(lowerQuery)
    );
  }, [messages]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const results = performSearch(query);
    setSearchResults(results);
    setCurrentResultIndex(0);
    return results;
  }, [performSearch]);

  const navigateToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(prev => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  const navigateToPrevResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults.length]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const getCurrentResult = useCallback(() => {
    if (searchResults.length === 0) return null;
    return searchResults[currentResultIndex];
  }, [searchResults, currentResultIndex]);

  return {
    searchQuery,
    searchResults,
    currentResultIndex,
    isSearchOpen,
    handleSearch,
    navigateToNextResult,
    navigateToPrevResult,
    openSearch,
    closeSearch,
    getCurrentResult,
    setCurrentResultIndex
  };
};