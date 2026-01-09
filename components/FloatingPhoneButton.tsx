'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, ArrowUp, ShoppingBag, Heart, Grid2X2, User, MessageCircle, X, Home } from 'lucide-react';

export function FloatingPhoneButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCategoryMenu = () => {
    setIsCategoryMenuOpen(!isCategoryMenuOpen);
  };

  const closeCategoryMenu = () => {
    setIsCategoryMenuOpen(false);
  };

  const categories = [
    { name: 'Men', href: '/products?category=men' },
    { name: 'Women', href: '/products?category=womens' },
    { name: 'Combo', href: '/products?category=combo' },
  ];

  return (
    <>
      {/* Right side floating action buttons (mobile only) */}
      <div className="fixed right-4 bottom-32 flex flex-col gap-3 z-40 md:hidden">
        {/* Cart */}
        <Link
          href="/cart"
          className="w-11 h-11 rounded-full bg-black shadow-lg flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
          aria-label="Go to cart"
        >
          <ShoppingBag className="w-5 h-5" />
        </Link>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className="w-11 h-11 rounded-full bg-black shadow-lg flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
          aria-label="Go to wishlist"
        >
          <Heart className="w-5 h-5" />
        </Link>

        {/* Scroll to Top - only when visible */}
        {isVisible && (
          <button
            onClick={scrollToTop}
            className="w-11 h-11 rounded-full bg-black shadow-lg flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Category Menu Overlay and Popup */}
      {isCategoryMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={closeCategoryMenu}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 md:hidden p-4 pointer-events-none">
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-xs pointer-events-auto"
            >
              <div className="p-4 space-y-3">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    href={category.href}
                    onClick={closeCategoryMenu}
                    className="flex items-center justify-between px-4 py-3 text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    <span className="text-base font-medium">{category.name}</span>
                    <span className="text-gray-400">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom mobile nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black text-white z-40 md:hidden">
        <div className="max-w-screen-sm mx-auto flex items-stretch">
          {/* 1. Category */}
          <button
            onClick={toggleCategoryMenu}
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px]"
          >
            <Grid2X2 className="w-5 h-5 mb-1" />
            <span>Category</span>
          </button>

          {/* 2. Wishlist */}
          <Link
            href="/wishlist"
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px]"
          >
            <Heart className="w-5 h-5 mb-1" />
            <span>Wishlist</span>
          </Link>

          {/* 3. Home icon in the middle */}
          <Link
            href="/"
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px]"
          >
            <Home className="w-5 h-5 mb-1" />
            <span>Home</span>
          </Link>

          {/* 4. Chat */}
          <a
            href="https://wa.me/8801604112279"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px]"
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span>Chat</span>
          </a>

          {/* 5. Call */}
          <a
            href="tel:+8801604112279"
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px]"
          >
            <Phone className="w-5 h-5 mb-1" />
            <span>Call</span>
          </a>
        </div>
      </nav>
    </>
  );
}

