'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Camera, X } from 'lucide-react';
import type { StorefrontProductList } from '@/types/akkho';
import { searchApi, getImageUrl } from '@/lib/api';

interface SearchDropdownProps {
  isMobile?: boolean;
  placeholder?: string;
  onClose?: () => void;
}

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function SearchDropdown({ isMobile = false, placeholder = "Search products...", onClose }: SearchDropdownProps) {
  const router = useRouter();
  
  const scrollPositionRef = useRef<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StorefrontProductList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isFocused, setIsFocused] = useState(false);

  const performSearch = async (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const data = await searchApi.unified(q);
      setSearchResults(data.products ?? []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      setShowDropdown(true);
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    }
  }, [searchQuery, searchResults.length]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setShowDropdown(false);
      onClose?.();
    }
  }, [searchQuery, router, onClose]);

  const handleResultClick = useCallback((slug: string) => {
    router.push(`/products/${encodeURIComponent(slug)}`);
    setShowDropdown(false);
    onClose?.();
  }, [router, onClose]);

  const handleViewAllResults = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setShowDropdown(false);
      onClose?.();
    }
  }, [searchQuery, router, onClose]);

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

  useEffect(() => {
    if (isMobile && searchInputRef.current) {
      const currentScrollPosition = window.pageYOffset;
      searchInputRef.current.focus({ preventScroll: true });
      if (window.pageYOffset !== currentScrollPosition) {
        window.scrollTo(0, currentScrollPosition);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollPositionRef.current = window.pageYOffset;
  });

  useEffect(() => {
    const preserveScroll = () => {
      const currentScroll = window.pageYOffset;
      if (Math.abs(currentScroll - scrollPositionRef.current) > 5) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }
    };

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
  ), [searchQuery, placeholder, isMobile, handleInputFocus, handleInputBlur, handleSubmit]);

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
        ) : hasSearched && searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
          <div className="search-empty">
            <div className="mb-2">No products found</div>
            <div className="text-sm text-gray-400">Try searching with different keywords</div>
          </div>
        ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
          <div className="search-empty text-sm text-gray-500 px-4 py-3">
            Type at least 2 characters to search
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto">
              {searchResults.slice(0, 8).map((product) => {
                const price = parsePrice(product.price);
                const orig = product.original_price ? parsePrice(product.original_price) : null;
                const hasDisc = orig != null && orig > price;
                return (
                <button
                  key={product.public_id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleResultClick(product.slug)}
                  className="search-result-item"
                >
                  <div className="flex items-center gap-3">
                    <div className="search-result-thumb">
                      {getImageUrl(product.image_url) ? (
                        <Image
                          src={getImageUrl(product.image_url)!}
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
                        {product.category_name || 'Category'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {hasDisc ? (
                          <>
                            <span className="text-sm font-medium text-black">
                              ৳{price.toFixed(0)}
                            </span>
                            <span className="text-xs text-gray-500 line-through">
                              ৳{orig!.toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-black">
                            ৳{price.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
            
            {searchResults.length > 0 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleViewAllResults}
                className="search-view-all"
              >
                View all results →
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
