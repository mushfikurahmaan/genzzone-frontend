'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip loading on initial mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Show loading when route changes
    setIsLoading(true);
    
    // Hide loading after page transition completes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg" />
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

