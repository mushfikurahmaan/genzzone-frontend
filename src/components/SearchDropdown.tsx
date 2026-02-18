'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Camera, X } from 'lucide-react';
import { Product, productApi, getImageUrl } from '@/lib/api';

interface SearchDropdownProps {
  isMobile?: boolean;
  placeholder?: string;
  onClose?: () => void;
}

export function SearchDropdown({ isMobile = false, placeholder = "Search products...", onClose }: SearchDropdownProps) {
  const router = useRouter();
  
  // Store scroll position to prevent unwanted scrolling
  const scrollPositionRef = useRef<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const results = await productApi.getAll(query.trim());
      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Keep dropdown open when there's a query and input is focused
    if (query.trim()) {
      setShowDropdown(true);
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms delay
  }, []); // Remove isFocused dependency to prevent re-renders

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    }
  }, [searchQuery, searchResults.length]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay blur to allow click on dropdown items
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setShowDropdown(false);
      onClose?.();
    }
  }, [searchQuery, router, onClose]);

  // Handle clicking on a search result
  const handleResultClick = useCallback((productId: number) => {
    router.push(`/products/${productId}`);
    setShowDropdown(false);
    onClose?.();
  }, [router, onClose]);

  // Handle "View All Results" click
  const handleViewAllResults = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setShowDropdown(false);
      onClose?.();
    }
  }, [searchQuery, router, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on mobile when component mounts
  useEffect(() => {
    if (isMobile && searchInputRef.current) {
      // Prevent scroll when focusing
      const currentScrollPosition = window.pageYOffset;
      searchInputRef.current.focus({ preventScroll: true });
      // Restore scroll position if it changed
      if (window.pageYOffset !== currentScrollPosition) {
        window.scrollTo(0, currentScrollPosition);
      }
    }
  }, [isMobile]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Prevent scroll changes during component updates (e.g., placeholder changes)
  useEffect(() => {
    scrollPositionRef.current = window.pageYOffset;
  });

  // Restore scroll position if it changes unexpectedly
  useEffect(() => {
    const preserveScroll = () => {
      const currentScroll = window.pageYOffset;
      if (Math.abs(currentScroll - scrollPositionRef.current) > 5) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }
    };

    // Check scroll position after render
    const timeoutId = setTimeout(preserveScroll, 0);
    return () => clearTimeout(timeoutId);
  });

  const SearchInput = useMemo(() => (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className={isMobile ? 'search-input-wrap-mobile' : 'search-input-wrap-desktop'}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={(e) => {
            const currentScroll = window.pageYOffset;
            handleInputFocus();
            requestAnimationFrame(() => {
              if (window.pageYOffset !== currentScroll) {
                window.scrollTo({ top: currentScroll, behavior: 'instant' });
              }
            });
          }}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`search-input-base ${isMobile ? 'search-input-mobile ml-0' : 'search-input-desktop'}`}
        />
        <button
          type="button"
          className="disabled-muted p-1 ml-2 rounded-md"
          aria-label="Search by image"
          disabled
        >
          <Camera className="w-5 h-5 text-gray-600" />
        </button>
        {!isMobile && (
          <button
            type="submit"
            className="p-2 hover:bg-gray-200 rounded-r-md border-l border-gray-300"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {searchQuery && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowDropdown(false);
              setHasSearched(false);
              setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0);
            }}
            className="p-1 hover:bg-gray-200 rounded-md ml-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </form>
  ), [searchQuery, placeholder, isMobile, handleInputFocus, handleInputBlur]);

  const SearchDropdownResults = () => {
    if (!showDropdown) return null;

    return (
      <div
        ref={dropdownRef}
        className={`search-dropdown ${isMobile ? 'search-dropdown-mobile' : 'search-dropdown-desktop'}`}
      >
        {isLoading ? (
          <div className="search-loading">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              Searching...
            </div>
          </div>
        ) : hasSearched && searchResults.length === 0 ? (
          <div className="search-empty">
            <div className="mb-2">No products found</div>
            <div className="text-sm text-gray-400">Try searching with different keywords</div>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto">
              {searchResults.slice(0, 8).map((product) => (
                <button
                  key={product.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleResultClick(product.id)}
                  className="search-result-item"
                >
                  <div className="flex items-center gap-3">
                    <div className="search-result-thumb">
                      {getImageUrl(product.image) ? (
                        <Image
                          src={getImageUrl(product.image)!}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <span className="product-card-placeholder-text">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black text-sm line-clamp-2">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.category?.name || 'Category'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {product.has_offer && product.offer_price ? (
                          <>
                            <span className="text-sm font-medium text-black">
                              ৳{parseFloat(product.offer_price).toFixed(0)}
                            </span>
                            <span className="text-xs text-gray-500 line-through">
                              ৳{parseFloat(product.regular_price).toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-black">
                            ৳{parseFloat(product.regular_price).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* View All Results Button */}
            {searchResults.length > 0 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleViewAllResults}
                className="search-view-all"
              >
                View all {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} →
              </button>
            )}
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="search-wrap">
      {SearchInput}
      <SearchDropdownResults />
    </div>
  );
}