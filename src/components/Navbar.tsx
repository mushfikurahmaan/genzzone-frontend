'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, X, Camera, Heart, User, ChevronRight, ChevronDown } from 'lucide-react';
import { notificationApi, categoryApi, Notification, Category } from '@/lib/api';
import { SearchDropdown } from './SearchDropdown';

const placeholders = [
  'SEARCH BY NAME',
  'SEARCH BY CATEGORY',
];

export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchNotification() {
      const activeNotification = await notificationApi.getActive();
      setNotification(activeNotification);
    }
    fetchNotification();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoryApi.getTree();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000); // Change placeholder every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
  };

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  const toggleCategoryExpansion = (category: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const openTrackingModal = () => {
    setIsTrackingModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setOrderId('');
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      // For now, redirect URL is blank as requested
      // This will be updated later with the actual Steadfast tracking URL
      const trackingUrl = ''; // Placeholder for Steadfast tracking URL
      
      if (trackingUrl) {
        window.location.href = trackingUrl;
      } else {
        // For now, just close the modal since URL is blank
        closeTrackingModal();
      }
    }
  };


  return (
    <nav className="nav">
      {/* Mobile Search Bar - only on mobile */}
      <div className="nav-mobile-search block md:hidden">
        <div className="container-main py-3">
          <SearchDropdown 
            isMobile={true} 
            placeholder={placeholders[placeholderIndex]}
            onClose={closeMobileMenu}
          />
        </div>
      </div>

      {/* Desktop Top Bar with Logo, Search, and Icons - only on desktop */}
      <div className="nav-desktop-bar hidden md:block">
        <div className="container-main py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="nav-logo-link"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/media/genzzone.jpg"
                  alt="GenZZone Logo"
                  width={120}
                  height={120}
                  className="nav-logo-img"
                />
                <div className="flex flex-col">
                  <span className="logo-gen">GEN-Z</span>
                  <span className="logo-zone">ZONE</span>
                </div>
              </div>
            </Link>

            {/* Centered Search Bar */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-2xl">
                <SearchDropdown 
                  isMobile={false} 
                  placeholder={placeholders[placeholderIndex]}
                />
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="nav-icon-btn-disabled">
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              <Link href="/wishlist" className="nav-icon-btn">
                <Heart className="w-5 h-5 text-black" />
              </Link>
              <div className="nav-icon-btn-disabled">
                <User className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Bar */}
      {notification && (
        <div className="nav-notification-bar">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* First set of marquee items */}
            <div className="flex items-center flex-shrink-0">
              {Array.from({ length: 100 }).map((_, i) => (
                <span key={`first-${i}`} className="text-xs md:text-sm uppercase font-medium mx-6 inline-block flex-shrink-0">
                  {notification.message}
                </span>
              ))}
            </div>
            {/* Duplicate set for seamless loop */}
            <div className="flex items-center flex-shrink-0" aria-hidden="true">
              {Array.from({ length: 100 }).map((_, i) => (
                <span key={`second-${i}`} className="text-xs md:text-sm uppercase font-medium mx-6 inline-block flex-shrink-0">
                  {notification.message}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block bg-white">
        <div className="container-main py-4">
          <div className="flex items-center justify-center gap-8">
            <Link href="/" className="nav-link">Home</Link>
            <div className="relative nav-dropdown-group">
              <button className="nav-link">Categories</button>
              <div className="nav-dropdown">
                <div className="py-2">
                  {categories.map((category) => (
                    <div key={category.id}>
                      {category.children.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 group/item">
                            <Link
                              href={`/products?category=${category.slug}`}
                              className="flex-1 text-black"
                            >
                              {category.name}
                            </Link>
                            <button
                              onClick={(e) => toggleCategoryExpansion(category.slug, e)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedCategories[category.slug] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {expandedCategories[category.slug] && (
                            <div className="pl-2">
                              {category.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/products?category=${child.slug}`}
                                  className="nav-dropdown-subitem"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="nav-dropdown-item"
                        >
                          {category.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/customer-reviews" className="nav-link">Customer Reviews</Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - only on mobile */}
      {isMobileMenuOpen && (
        <div className="nav-mobile-overlay md:hidden" onClick={closeMobileMenu} />
      )}

      {/* Mobile Navigation Menu - only on mobile, off-canvas until open */}
      <div
        className={`nav-mobile-drawer md:hidden ${isMobileMenuOpen ? 'nav-mobile-drawer-open' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="nav-mobile-drawer-header">
            <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <div className="flex flex-col">
                <span className="logo-gen-sm">GEN-Z</span>
                <span className="logo-gen-sm">G</span>
                <span className="logo-zone-sm">ZONE</span>
              </div>
            </Link>
            <button
              onClick={closeMobileMenu}
              className="w-6 h-6 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="flex flex-col p-4 space-y-2">
            <Link href="/" className="nav-mobile-link" onClick={closeMobileMenu}>
              Home
            </Link>
            <div>
              <button
                onClick={toggleCategories}
                className="w-full nav-mobile-link text-left"
              >
                Categories
              </button>
              {/* Mobile Categories Dropdown */}
              {isCategoriesOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  {categories.map((category) => (
                    <div key={category.id}>
                      {category.children.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-sm py-2">
                            <Link
                              href={`/products?category=${category.slug}`}
                              className="flex-1 text-gray-700 hover:text-black"
                              onClick={closeMobileMenu}
                            >
                              {category.name}
                            </Link>
                            <button
                              onClick={(e) => toggleCategoryExpansion(category.slug, e)}
                              className="p-1"
                            >
                              {expandedCategories[category.slug] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {expandedCategories[category.slug] && (
                            <div className="pl-4 space-y-2">
                              {category.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/products?category=${child.slug}`}
                                  className="block text-sm text-gray-600 hover:text-black py-2"
                                  onClick={closeMobileMenu}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="block text-sm text-gray-700 hover:text-black py-2"
                          onClick={closeMobileMenu}
                        >
                          {category.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/customer-reviews" className="nav-mobile-link" onClick={closeMobileMenu}>
              Customer Reviews
            </Link>
            <button onClick={openTrackingModal} className="nav-mobile-link text-left">
              Track Your Parcel
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {isTrackingModalOpen && (
        <>
          <div className="modal-overlay" onClick={closeTrackingModal} />
          <div className="modal-dialog">
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="modal-title">Track Your Parcel</h2>
                <button
                  onClick={closeTrackingModal}
                  className="text-gray-500 hover:text-black"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleTrackOrder}>
                <div className="mb-4">
                  <label htmlFor="orderId" className="form-label">
                    Enter Order ID
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID"
                    className="form-input"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-track">
                    Track
                  </button>
                  <button type="button" onClick={closeTrackingModal} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

