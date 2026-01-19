'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t-2 border-red-600 pb-24 md:pb-12">
      <div className="container mx-auto px-4 pt-12 pb-4 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Contact Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image
                src="/media/genzzone.jpg"
                alt="GenZZone Logo"
                width={144}
                height={144}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-red-600 leading-tight" style={{ fontFamily: 'var(--font-funnel-sans)' }}>GEN-Z</span>
                <span className="text-xl font-extrabold text-black leading-tight" style={{ fontFamily: 'var(--font-funnel-sans)' }}>ZONE</span>
              </div>
            </div>
            <div className="space-y-3 text-sm text-black">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">HEAD OFFICE:</span>
                  <p className="mt-1">Dhaka - Bangladesh</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">EMAIL:</span>
                  <p className="mt-1">genzzone11@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">PHONE:</span>
                  <p className="mt-1">+8801604112279</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Information Links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 text-black">CUSTOMER</h3>
              <div className="space-y-2 text-sm">
                <Link href="/account" className="block text-black hover:text-red-600 transition-colors">
                  Account
                </Link>
                <span className="block text-black opacity-30 cursor-not-allowed pointer-events-none">
                  Cart
                </span>
                <Link href="/wishlist" className="block text-black hover:text-red-600 transition-colors">
                  Wishlist
                </Link>
                <Link href="/blog" className="block text-black hover:text-red-600 transition-colors">
                  Blog
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 text-black">INFORMATION</h3>
              <div className="space-y-2 text-sm">
                <Link href="/about-us" className="block text-black hover:text-red-600 transition-colors">
                  About us
                </Link>
                <Link href="/contact-us" className="block text-black hover:text-red-600 transition-colors">
                  Contact Us
                </Link>
                <Link href="/privacy-policy" className="block text-black hover:text-red-600 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/refund-policy" className="block text-black hover:text-red-600 transition-colors">
                  Return & Refund
                </Link>
                <Link href="/cancellation-policy" className="block text-black hover:text-red-600 transition-colors">
                  Cancellation Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 text-black">SOCIAL LINKS</h3>
            <div className="flex items-center gap-4">
              <Link
                href="https://www.facebook.com/genzzone1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/media/social-icons/facebook.png"
                  alt="Facebook"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </Link>
              <Link
                href="https://www.tiktok.com/@genzzone11"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/media/social-icons/tiktok.png"
                  alt="TikTok"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright & Developed By Credit */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2026 Gen-Z Zone. All rights reserved. | Developed by{' '}
            <a
              href="https://wa.me/8801601571480"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              Mushfikur Rahman
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

