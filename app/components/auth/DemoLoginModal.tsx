'use client';

import React, { useEffect, useState } from 'react';

export interface DemoAccount {
  roleKey: string;
  roleName: string;
  email: string;
  password: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  permittedActions: string[];
  landingPage: string;
}

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: DemoAccount, autoSubmit?: boolean) => void;
  authenticatingRole?: string | null;
}

export function DemoLoginModal({
  isOpen,
  onClose,
  onSelectAccount,
  authenticatingRole,
}: DemoLoginModalProps) {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchDemoAccounts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/demo-accounts?demo=true');
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Demo logins are disabled in production or this environment.');
          }
          throw new Error(`Failed to load demo accounts (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setAccounts(data.accounts || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve demo accounts');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDemoAccounts();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-logins-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  id="demo-logins-title"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#0f172a',
                  }}
                >
                  Developer Demo Logins
                </h2>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Dev Only
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Select an acceptance testing role to review permissions and populate the sign-in form.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '6px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div
              style={{
                padding: '3rem 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Loading verified demo accounts...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              <strong>Unable to load demo accounts:</strong> {error}
            </div>
          )}

          {!loading && !error && accounts.length === 0 && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              No demo accounts found. Please run{' '}
              <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                npm run seed:demo
              </code>{' '}
              in your terminal to seed test fixtures.
            </div>
          )}

          {!loading && !error && accounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accounts.map((acc) => {
                const isAuthenticating = authenticatingRole === acc.roleKey;
                return (
                  <div
                    key={acc.roleKey}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.125rem',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: acc.badgeBg,
                              color: acc.badgeColor,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {acc.roleName}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.375rem 0', fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                          {acc.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
                          <span>Email:</span>
                          <code
                            style={{
                              fontFamily: 'monospace',
                              backgroundColor: '#f1f5f9',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              color: '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            {acc.email}
                          </code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          id={`demo-use-${acc.roleKey}`}
                          data-testid={`demo-use-${acc.roleKey}`}
                          disabled={Boolean(authenticatingRole)}
                          onClick={() => onSelectAccount(acc, false)}
                          style={{
                            padding: '0.5rem 0.875rem',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: authenticatingRole ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          Use Demo Account
                        </button>

                        <button
                          type="button"
                          id={`demo-direct-${acc.roleKey}`}
                          data-testid={`demo-direct-${acc.roleKey}`}
                          disabled={Boolean(authenticatingRole)}
                          onClick={() => onSelectAccount(acc, true)}
                          style={{
                            padding: '0.5rem 0.875rem',
                            backgroundColor: acc.badgeColor || '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: authenticatingRole ? 'not-allowed' : 'pointer',
                            opacity: isAuthenticating ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          {isAuthenticating ? 'Signing In...' : 'Sign In Directly →'}
                        </button>
                      </div>
                    </div>

                    {/* Permitted Actions */}
                    <div
                      style={{
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '0.375rem',
                        }}
                      >
                        Permitted Actions &amp; Scope:
                      </span>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '1.125rem',
                          fontSize: '0.75rem',
                          color: '#475569',
                          lineHeight: 1.5,
                        }}
                      >
                        {acc.permittedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <span>
            Verified dev password: <code>Password123!@#</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.4rem 0.75rem',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
