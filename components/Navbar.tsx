'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Menu, X, Camera, Heart, User } from 'lucide-react';
import { notificationApi, Notification } from '@/lib/api';
export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
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
  };

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
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
      closeMobileMenu();
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Mobile Search Bar */}
      <div className="md:hidden bg-black">
        <div className="container mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="flex items-center flex-1 bg-white rounded-l-md px-3 py-2">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY TYP"
                className="flex-1 bg-transparent focus:outline-none text-xs text-gray-800 placeholder-gray-500"
              />
              <button
                type="button"
                className="ml-2 p-1 rounded-md bg-white opacity-30 cursor-not-allowed pointer-events-none"
                aria-label="Search by image"
                disabled
              >
                <Camera className="w-5 h-5 text-black" />
              </button>
            </div>
            <button
              type="submit"
              className="ml-2 w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center shadow-md"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Top Bar with Logo, Search, and Icons */}
      <div className="hidden md:block border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden w-6 h-6 flex items-center justify-center flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-black" />
              ) : (
                <Menu className="w-6 h-6 text-black" />
              )}
            </button>

            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2 flex-shrink-0" 
              onClick={closeMobileMenu}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-red-600 leading-tight">GEN Z</span>
                  <span className="text-xl font-bold text-black leading-tight">ZONE</span>
                </div>
              </div>
            </Link>

            {/* Centered Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-2xl mx-4">
              <div className="relative w-full flex items-center bg-gray-100 rounded-md border border-gray-300">
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BY NAME"
                  className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-black placeholder-gray-500 text-sm"
                />
                <button
                  type="button"
                  className="p-2 hover:bg-gray-200 rounded-r-md opacity-30 cursor-not-allowed pointer-events-none"
                  aria-label="Search by image"
                  disabled
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  type="submit"
                  className="p-2 hover:bg-gray-200 rounded-r-md border-l border-gray-300"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative p-2 opacity-30 cursor-not-allowed pointer-events-none">
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded">
                <Heart className="w-5 h-5 text-black" />
              </Link>
              <div className="relative p-2 opacity-30 cursor-not-allowed pointer-events-none">
                <User className="w-5 h-5 text-black" />
              </div>
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
                  <Link
                    href="/products?category=combo"
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    Combo
                  </Link>
                  <Link
                    href="/products?category=men"
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    Men
                  </Link>
                  <Link
                    href="/products?category=womens"
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    Women
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/customer-reviews" className="text-sm font-medium text-black hover:underline">
              Customer Reviews
            </Link>
          </div>
        </div>
      </div>

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
              className="flex items-center gap-2"
              onClick={closeMobileMenu}
            >
              <div className="flex flex-col">
                <span className="text-lg font-bold text-red-600 leading-tight">GEN-Z</span>
                <span className="text-lg font-bold text-red-600 leading-tight">G</span>
                <span className="text-lg font-bold text-black leading-tight">ZONE</span>
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
                  <Link
                    href="/products?category=men"
                    className="block text-sm text-gray-700 hover:text-black py-2"
                    onClick={closeMobileMenu}
                  >
                    Men
                  </Link>
                  <Link
                    href="/products?category=womens"
                    className="block text-sm text-gray-700 hover:text-black py-2"
                    onClick={closeMobileMenu}
                  >
                    Women
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

