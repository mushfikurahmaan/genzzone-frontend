'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { notificationApi, Notification } from '@/lib/api';
export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMenSubmenuOpen, setIsMenSubmenuOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderId, setOrderId] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    async function fetchNotification() {
      const activeNotification = await notificationApi.getActive();
      setNotification(activeNotification);
    }
    fetchNotification();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
    setIsMenSubmenuOpen(false);
  };

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
    setIsMenSubmenuOpen(false);
  };

  const toggleMenSubmenu = () => {
    setIsMenSubmenuOpen(!isMenSubmenuOpen);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      closeMobileMenu();
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus search input after it appears
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Top Bar with Logo and Icons */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden w-6 h-6 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-black" />
              ) : (
                <Menu className="w-6 h-6 text-black" />
              )}
            </button>

            {/* Search (Desktop Only) */}
            <div className="hidden md:flex items-center gap-4">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black text-black w-64"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-2 hover:bg-gray-100 rounded"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5 text-black" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={toggleSearch}
                  className="p-2 hover:bg-gray-100 rounded"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5 text-black cursor-pointer" />
                </button>
              )}
            </div>

            {/* Logo */}
            <Link 
              href="/" 
              className="text-2xl md:text-3xl font-bold tracking-tight text-center flex-1 md:flex-none" 
              onClick={closeMobileMenu}
            >
              Gen Z Zone
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              {/* Search (Mobile Only) */}
              <button
                onClick={toggleSearch}
                className="md:hidden p-2 hover:bg-gray-100 rounded"
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-black cursor-pointer" />
              </button>
              <Link href="/cart" className="relative opacity-30 pointer-events-none">
                <ShoppingBag className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Bar */}
      {notification && (
        <div className="bg-black text-white py-2">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs md:text-sm">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8">
            <Link href="/" className="text-sm font-medium text-black hover:underline">
              Home
            </Link>
            <div className="relative group">
              <button className="text-sm font-medium text-black hover:underline">
                Categories
              </button>
              {/* Dropdown Menu */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="relative group/men">
                    <Link
                      href="/products?category=men"
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                    >
                      Men
                    </Link>
                    {/* Men Submenu */}
                    <div className="absolute left-full top-0 ml-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover/men:opacity-100 group-hover/men:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <Link
                          href="/products?category=men"
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        >
                          All Men
                        </Link>
                        <Link
                          href="/products?category=men_shirt"
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        >
                          Shirt
                        </Link>
                        <Link
                          href="/products?category=men_panjabi"
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        >
                          Panjabi
                        </Link>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/products?category=womens"
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    Womens
                  </Link>
                  <Link
                    href="/products?category=combo"
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    Combo
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/customer-reviews" className="text-sm font-medium text-black hover:underline">
              Customer Reviews
            </Link>
            <button 
              onClick={openTrackingModal}
              className="text-sm font-medium text-black hover:underline"
            >
              Track Your Parcel
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                id="mobile-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or description..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black text-black"
                autoFocus
              />
              <button
                type="submit"
                className="p-2 hover:bg-gray-100 rounded"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-black" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-gray-100 rounded"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Navigation Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link 
              href="/" 
              className="text-xl font-bold"
              onClick={closeMobileMenu}
            >
              Gen Z Zone
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
            <Link
              href="/"
              className="text-base font-medium text-black hover:underline py-2"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            
            {/* Categories with Dropdown */}
            <div>
              <button
                onClick={toggleCategories}
                className="w-full text-base font-medium text-black hover:underline py-2 text-left"
              >
                Categories
              </button>
              {/* Mobile Categories Dropdown */}
              {isCategoriesOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  <div>
                    <button
                      onClick={toggleMenSubmenu}
                      className="w-full text-left text-sm text-gray-700 hover:text-black py-2 flex items-center justify-between"
                    >
                      <span>Men</span>
                      <span className={`transform transition-transform ${isMenSubmenuOpen ? 'rotate-90' : ''}`}>
                        ›
                      </span>
                    </button>
                    {/* Men Submenu - Only visible when isMenSubmenuOpen is true */}
                    {isMenSubmenuOpen && (
                      <div className="pl-4 mt-1 space-y-1">
                        <Link
                          href="/products?category=men"
                          className="block text-xs text-gray-600 hover:text-black py-1"
                          onClick={closeMobileMenu}
                        >
                          All Men
                        </Link>
                        <Link
                          href="/products?category=men_shirt"
                          className="block text-xs text-gray-600 hover:text-black py-1"
                          onClick={closeMobileMenu}
                        >
                          Shirt
                        </Link>
                        <Link
                          href="/products?category=men_panjabi"
                          className="block text-xs text-gray-600 hover:text-black py-1"
                          onClick={closeMobileMenu}
                        >
                          Panjabi
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/products?category=womens"
                    className="block text-sm text-gray-700 hover:text-black py-2"
                    onClick={closeMobileMenu}
                  >
                    Womens
                  </Link>
                  <Link
                    href="/products?category=combo"
                    className="block text-sm text-gray-700 hover:text-black py-2"
                    onClick={closeMobileMenu}
                  >
                    Combo
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/customer-reviews"
              className="text-base font-medium text-black hover:underline py-2"
              onClick={closeMobileMenu}
            >
              Customer Reviews
            </Link>
            <button
              onClick={openTrackingModal}
              className="text-base font-medium text-black hover:underline py-2 text-left"
            >
              Track Your Parcel
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {isTrackingModalOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={closeTrackingModal}
          />
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Track Your Parcel</h2>
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
                  <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Order ID
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Track
                  </button>
                  <button
                    type="button"
                    onClick={closeTrackingModal}
                    className="flex-1 bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
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

