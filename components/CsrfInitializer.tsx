'use client';

import { useEffect } from 'react';

export function CsrfInitializer() {
  useEffect(() => {
    // Fetch CSRF token on app initialization
    const initCsrf = async () => {
      try {
        await fetch('https://api.genzzone.com/api/csrf/', {
          credentials: 'include',
        });
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };

    initCsrf();
  }, []);

  return null;
}

