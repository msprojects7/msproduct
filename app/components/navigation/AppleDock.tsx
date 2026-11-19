'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Printer,
  Palette,
  FileSpreadsheet,
  BarChart3,
  Shield,
  Settings,
  Calendar,
  Building2,
  LogOut,
  ChevronDown,
  UserCheck,
  Award,
  Ticket,
  Tag,
  FileText,
  Globe,
  CheckCircle,
  Monitor,
} from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

export interface AppleDockProps {
  variant?: 'public' | 'event' | 'org' | 'dashboard';
  eventSlug?: string;
  eventName?: string;
  orgSlug?: string;
  orgName?: string;
  userRole?: string;
  userName?: string;
  activeKey?: string;
}

export function AppleDock({
  variant = 'public',
  eventSlug,
  eventName,
  orgSlug,
  orgName,
  userRole,
  activeKey,
}: AppleDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      router.push('/auth/sign-in?logged_out=true');
      router.refresh();
    } catch {
      window.location.href = '/auth/sign-in?logged_out=true';
    } finally {
      setSigningOut(false);
    }
  };

  // 1. PUBLIC VARIANT (Homepage, Landing)
  if (variant === 'public') {
    const publicLinks = [
      { label: 'Capabilities', href: '/#capabilities' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/#pricing' },
    ];

    return (
      <header className="sticky top-3 z-40 px-3 sm:px-6 w-full mb-6">
        <nav
          aria-label="MS Backstage Navigation Dock"
          className="max-w-5xl mx-auto px-3 sm:px-4 py-2 glass-dock rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-between"
        >
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-300 dark:border-slate-700">
              <img src="/msfav.png" alt="MS Backstage" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">MS Backstage</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">Event Platform</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Link
              href="/auth/sign-in"
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  // 2. DASHBOARD / CONSOLE ROOT VARIANT
  if (variant === 'dashboard') {
    return (
      <header className="sticky top-3 z-40 px-3 sm:px-6 w-full mb-6">
        <nav
          aria-label="Workspace Console Dock"
          className="max-w-6xl mx-auto px-3.5 sm:px-4 py-2 glass-dock rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-300 dark:border-slate-700">
                <img src="/msfav.png" alt="MS Backstage" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">MS Backstage</span>
            </Link>
            <div className="h-4 w-px bg-slate-300 dark:bg-white/15 hidden sm:block" />
            <span className="hidden sm:inline-flex text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              Workspace Console
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle size="sm" />
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/organizations/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>New Org</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded-xl transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </nav>
      </header>
    );
  }

  // 3. ORGANIZATION VARIANT
  if (variant === 'org' && orgSlug) {
    const orgLinks = [
      { key: 'events', label: 'Events', href: `/organizations/${orgSlug}`, icon: Calendar },
      { key: 'members', label: 'Members', href: `/organizations/${orgSlug}/members`, icon: Users },
      { key: 'settings', label: 'Settings', href: `/organizations/${orgSlug}/settings`, icon: Settings },
    ];

    return (
      <header className="sticky top-3 z-40 px-3 sm:px-6 w-full mb-6">
        <nav
          aria-label="Organization Dock"
          className="max-w-6xl mx-auto px-3 sm:px-4 py-2 glass-dock rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-between"
        >
          {/* Organization Context Identity */}
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-300 dark:border-slate-700 hover:border-slate-500 transition">
              <img src="/msfav.png" alt="MS Backstage" className="w-full h-full object-contain" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[130px] sm:max-w-[200px]">
                {orgName || orgSlug}
              </span>
              {userRole && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider hidden sm:inline">
                  {userRole}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            {orgLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey ? activeKey === item.key : pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            <ThemeToggle size="sm" />

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>
    );
  }

  // 4. EVENT WORKSPACE VARIANT (Primary SaaS Engine)
  const resolvedEventSlug = eventSlug || '';
  if (!resolvedEventSlug) return null;

  const primaryEventItems = [
    { key: 'dashboard', label: 'Console', href: `/events/${resolvedEventSlug}`, icon: LayoutDashboard },
    { key: 'attendees', label: 'Attendees', href: `/events/${resolvedEventSlug}/attendees`, icon: Users },
    { key: 'spot', label: 'Spot Reg', href: `/events/${resolvedEventSlug}/spot-registration`, icon: UserCheck },
    { key: 'scanner', label: 'Scanner', href: `/events/${resolvedEventSlug}/scanner`, icon: QrCode },
    { key: 'badges', label: 'Badges', href: `/events/${resolvedEventSlug}/badges`, icon: Printer },
    { key: 'designer', label: 'Designer', href: `/events/${resolvedEventSlug}/badges/designer`, icon: Palette },
    { key: 'reports', label: 'Reports', href: `/events/${resolvedEventSlug}/reports`, icon: BarChart3 },
  ];

  const eventMenuCategories = [
    {
      title: 'Content & Schedule',
      items: [
        { key: 'agenda', label: 'Agenda & Tracks', href: `/events/${resolvedEventSlug}/agenda`, icon: Calendar },
        { key: 'speakers', label: 'Speakers & Faculty', href: `/events/${resolvedEventSlug}/speakers`, icon: Users },
        { key: 'sponsors', label: 'Sponsors & Booths', href: `/events/${resolvedEventSlug}/sponsors`, icon: Award },
      ],
    },
    {
      title: 'Ticketing & Registration',
      items: [
        { key: 'website', label: 'Website Builder', href: `/events/${resolvedEventSlug}/website`, icon: Globe },
        { key: 'tickets', label: 'Tickets & Pricing', href: `/events/${resolvedEventSlug}/tickets`, icon: Ticket },
        { key: 'forms', label: 'Registration Forms', href: `/events/${resolvedEventSlug}/registration-forms`, icon: FileText },
        { key: 'registrations', label: 'Orders & Sales', href: `/events/${resolvedEventSlug}/registrations`, icon: UserCheck },
      ],
    },
    {
      title: 'Onsite Desk & Badging',
      items: [
        { key: 'checkin', label: 'Check-In Operations', href: `/events/${resolvedEventSlug}/check-in`, icon: CheckCircle },
        { key: 'zones', label: 'Zone Access Control', href: `/events/${resolvedEventSlug}/zones`, icon: Shield },
        { key: 'badgeprinting', label: 'Badge Printing Ops', href: `/events/${resolvedEventSlug}/badge-printing`, icon: Printer },
      ],
    },
    {
      title: 'Intelligence & Certificates',
      items: [
        { key: 'analytics_attendance', label: 'Attendance & Footfall', href: `/events/${resolvedEventSlug}/analytics/attendance`, icon: BarChart3 },
        { key: 'certificates', label: 'Certificates Studio', href: `/events/${resolvedEventSlug}/certificates`, icon: Award },
        { key: 'import', label: 'Import Attendees', href: `/events/${resolvedEventSlug}/import`, icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Settings & Security',
      items: [
        { key: 'staff', label: 'Staff Management', href: `/events/${resolvedEventSlug}/staff`, icon: Users },
        { key: 'audit', label: 'Security Audit Log', href: `/events/${resolvedEventSlug}/audit`, icon: Shield },
        { key: 'settings', label: 'Event Settings', href: `/events/${resolvedEventSlug}/settings`, icon: Settings },
      ],
    },
  ];

  return (
    <header className="sticky top-3 z-40 px-2 sm:px-6 w-full mb-6">
      <nav
        aria-label="Event Operations Floating Dock"
        className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 glass-dock rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-between"
      >
        {/* Left: Organization / Event Context Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={orgSlug ? `/organizations/${orgSlug}` : '/dashboard'}
            className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-300 dark:border-slate-700 hover:border-slate-500 transition"
            title="Back to Organization"
          >
            <img src="/msfav.png" alt="MS Backstage" className="w-full h-full object-contain" />
          </Link>
          <div className="flex flex-col max-w-[90px] sm:max-w-[160px] md:max-w-[200px]">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {eventName || resolvedEventSlug}
            </span>
            {orgName && (
              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {orgName}
              </span>
            )}
          </div>
        </div>

        {/* Center: Primary Navigation Links */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {primaryEventItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey ? activeKey === item.key : pathname === item.href;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
                title={item.label}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap hidden lg:inline">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 hidden sm:block" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Theme Toggle, More Menu & Sign Out */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <ThemeToggle size="sm" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              aria-label="More tools and event settings"
              aria-expanded={dropdownOpen}
            >
              <span className="text-[11px] sm:text-xs hidden sm:inline">More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-[calc(100vh-100px)] overflow-y-auto py-2 px-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-3">
                  {eventMenuCategories.map((cat) => (
                    <div key={cat.title} className="space-y-0.5">
                      <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {cat.title}
                      </div>
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isItemActive = pathname === item.href;
                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition ${
                              isItemActive
                                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isItemActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition hidden sm:inline-flex"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </header>
  );
}

export default AppleDock;
