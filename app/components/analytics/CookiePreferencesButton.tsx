'use client';

import React from 'react';

export function CookiePreferencesButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ms_cookie_consent');
          window.location.reload();
        }
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        textDecoration: 'underline',
      }}
    >
      Cookie Preferences
    </button>
  );
}
