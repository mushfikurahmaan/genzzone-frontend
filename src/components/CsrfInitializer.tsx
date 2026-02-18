'use client';

import { useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dash.genzzone.com';

export function CsrfInitializer() {
  useEffect(() => {
    const initCsrf = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/csrf/`, {
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

