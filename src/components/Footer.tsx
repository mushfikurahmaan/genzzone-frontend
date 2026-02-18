'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container-main footer-container">
        <div className="footer-grid">
          {/* Logo & Contact Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image
                src="/media/genzzone.jpg"
                alt="GenZZone Logo"
                width={144}
                height={144}
                className="footer-logo-img"
              />
              <div className="flex flex-col">
                <span className="logo-gen">GEN-Z</span>
                <span className="logo-zone">ZONE</span>
              </div>
            </div>
            <div className="footer-contact-wrap">
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon" />
                <div>
                  <span className="font-semibold">HEAD OFFICE:</span>
                  <p className="mt-1">Dhaka - Bangladesh</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon" />
                <div>
                  <span className="font-semibold">EMAIL:</span>
                  <p className="mt-1">genzzone11@gmail.com</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon" />
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
              <h3 className="footer-heading">CUSTOMER</h3>
              <div className="space-y-2 text-sm">
                <Link href="/account" className="footer-link">Account</Link>
                <span className="footer-link-disabled">Cart</span>
                <Link href="/wishlist" className="footer-link">Wishlist</Link>
                <Link href="/blog" className="footer-link">Blog</Link>
              </div>
            </div>
            <div>
              <h3 className="footer-heading">INFORMATION</h3>
              <div className="space-y-2 text-sm">
                <Link href="/about-us" className="footer-link">About us</Link>
                <Link href="/contact-us" className="footer-link">Contact Us</Link>
                <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
                <Link href="/refund-policy" className="footer-link">Return & Refund</Link>
                <Link href="/cancellation-policy" className="footer-link">Cancellation Policy</Link>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="footer-heading">SOCIAL LINKS</h3>
            <div className="flex items-center gap-4">
              <Link
                href="https://www.facebook.com/genzzone1"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
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
                className="social-link"
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

        <div className="footer-credit">
          <p className="w-full text-center">
            © 2026 Gen-Z Zone. All rights reserved. | Developed by{' '}
            <a
              href="https://mushfikurahmaan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit-link"
            >
              Mushfikur Rahman
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

