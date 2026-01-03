'use client';

import { Phone } from 'lucide-react';

export function FloatingPhoneButton() {
  return (
    <a
      href="tel:+8801604112279"
      className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110 flex items-center justify-center w-14 h-14"
      aria-label="Call us at +880 1604-112279"
    >
      <Phone className="w-6 h-6" />
    </a>
  );
}

