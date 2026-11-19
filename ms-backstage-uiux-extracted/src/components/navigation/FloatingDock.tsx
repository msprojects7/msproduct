import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  QrCode, 
  CreditCard, 
  BarChart3, 
  Building2, 
  Calendar, 
  UserCheck, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  FileSpreadsheet, 
  FileText,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Palette,
  ExternalLink
} from 'lucide-react';
import { UserRole } from '../../types';

export const FloatingDock: React.FC = () => {
  const { 
    currentRoute, 
    navigate, 
    theme,
    toggleTheme,
    organizations, 
    currentOrg, 
    setCurrentOrgId, 
    events, 
    currentEvent, 
    setCurrentEventId, 
    currentUser, 
    currentRole, 
    setCurrentRole 
  } = useApp();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPublicRoute = ['home', 'features', 'pricing', 'signin', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'event-public'].includes(currentRoute);

  const roles: UserRole[] = [
    'Organization Owner',
    'Event Manager',
    'Registration Staff',
    'Scanner Operator',
    'Platform Admin'
  ];

  // Role permissions filter
  const canViewReports = ['Organization Owner', 'Event Manager', 'Platform Admin'].includes(currentRole);
  const canViewSpotReg = ['Organization Owner', 'Event Manager', 'Registration Staff', 'Platform Admin'].includes(currentRole);
  const canViewBadges = ['Organization Owner', 'Event Manager', 'Registration Staff', 'Platform Admin'].includes(currentRole);
  const canViewScanner = true; // All roles can use scanner
  const canViewAttendees = true;
  const canViewDashboard = ['Organization Owner', 'Event Manager', 'Platform Admin'].includes(currentRole);
  const canViewWebsiteBuilder = ['Organization Owner', 'Event Manager', 'Platform Admin'].includes(currentRole);

  const navItems = [
    ...(canViewDashboard ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(canViewAttendees ? [{ id: 'attendees', label: 'Attendees', icon: Users }] : []),
    ...(canViewSpotReg ? [{ id: 'spot-registration', label: 'Spot Reg', icon: UserPlus }] : []),
    ...(canViewScanner ? [{ id: 'scanner', label: 'Scanner', icon: QrCode }] : []),
    ...(canViewBadges ? [{ id: 'badges', label: 'Badge Desk', icon: CreditCard }] : []),
    ...(canViewWebsiteBuilder ? [{ id: 'event-builder', label: 'Website Builder', icon: Globe }] : []),
    ...(canViewReports ? [{ id: 'reports', label: 'Reports', icon: BarChart3 }] : [])
  ];

  return (
    <header className="sticky top-3 z-40 w-full px-4 sm:px-6 flex justify-center pointer-events-none no-print">
      <div className="w-full max-w-6xl flex items-center justify-between pointer-events-auto">
        {/* Main Floating Glass Dock Surface */}
        <div className="w-full glass-dock rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-200">
          
          {/* LEFT ZONE: Logo & Brand Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(isPublicRoute ? 'home' : 'dashboard')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-md shadow-indigo-950/40 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-200" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white leading-none">
                  MS BACKSTAGE
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                  Event OS
                </span>
              </div>
            </button>

            {/* Authenticated Workspace & Event Selector Context */}
            {!isPublicRoute && (
              <div className="relative ml-2 pl-2 border-l border-slate-700/60" ref={workspaceRef}>
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">{currentEvent.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Workspace Dropdown Popover */}
                {isWorkspaceMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl glass-popover p-2 shadow-2xl border border-slate-700/80 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Organization</span>
                      <button 
                        onClick={() => { setIsWorkspaceMenuOpen(false); navigate('orgs-overview'); }}
                        className="text-indigo-400 hover:text-indigo-300 normal-case font-medium"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="space-y-1 mb-2">
                      {organizations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => {
                            setCurrentOrgId(org.id);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            org.id === currentOrg.id 
                              ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30' 
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{org.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">{org.plan}</span>
                        </button>
                      ))}
                    </div>

                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-700/60 pt-2 flex items-center justify-between">
                      <span>Events</span>
                      <button 
                        onClick={() => { setIsWorkspaceMenuOpen(false); navigate('events-list'); }}
                        className="text-indigo-400 hover:text-indigo-300 normal-case font-medium"
                      >
                        All ({events.length})
                      </button>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {events.map(evt => (
                        <button
                          key={evt.id}
                          onClick={() => {
                            setCurrentEventId(evt.id);
                            setIsWorkspaceMenuOpen(false);
                            if (currentRoute === 'home') navigate('events-dashboard');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            evt.id === currentEvent.id 
                              ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30' 
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{evt.name}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            evt.status === 'Live' ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 bg-slate-900'
                          }`}>
                            {evt.status}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-700/60 mt-2 pt-2 flex items-center gap-1">
                      <button
                        onClick={() => { setIsWorkspaceMenuOpen(false); navigate('events-create'); }}
                        className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition-colors shadow-sm"
                      >
                        + Create New Event
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTER ZONE: Navigation Items */}
          {isPublicRoute ? (
            /* Public Marketing Dock Links */
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                type="button"
                onClick={() => navigate('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentRoute === 'home' 
                    ? 'bg-white/10 text-white shadow-inner font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => navigate('features')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentRoute === 'features' 
                    ? 'bg-white/10 text-white shadow-inner font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentRoute === 'pricing' 
                    ? 'bg-white/10 text-white shadow-inner font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Pricing
              </button>
              <button
                type="button"
                onClick={() => navigate('event-public')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentRoute === 'event-public' 
                    ? 'bg-white/10 text-white shadow-inner font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Sample Event Site
              </button>
            </nav>
          ) : (
            /* Authenticated App Dock Links */
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id || 
                  (item.id === 'badges' && (currentRoute === 'badge-designer' || currentRoute === 'print-preview'));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* RIGHT ZONE: Theme Toggle, Role Switcher Simulator & User Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* LIGHT / DARK THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60 transition-all flex items-center justify-center shadow-sm"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {isPublicRoute ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('signin')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('signup')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-950/40 active:scale-95"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Role Simulation Switcher Badge */}
                <div className="relative" ref={roleRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    title="Switch user role simulation"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/40 transition-colors"
                  >
                    <UserCheck className="w-3 h-3 text-indigo-400" />
                    <span className="truncate max-w-[100px]">{currentRole}</span>
                    <ChevronDown className="w-3 h-3 text-indigo-400 shrink-0" />
                  </button>

                  {isRoleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-popover p-2 shadow-2xl border border-slate-700/80 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Simulate Role View
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {roles.map(r => (
                          <button
                            key={r}
                            onClick={() => {
                              setCurrentRole(r);
                              setIsRoleMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                              currentRole === r
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <span>{r}</span>
                            {currentRole === r && <Sparkles className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-700/60 px-2 text-[10px] text-slate-400 leading-tight">
                        Switching roles updates active dock navigation & permissions in this prototype.
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Avatar Popover */}
                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-700 flex items-center justify-center text-xs font-bold text-white transition-all shadow-inner focus:outline-none"
                    aria-label="User profile menu"
                  >
                    SK
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-popover p-2 shadow-2xl border border-slate-700/80 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
                        <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] text-indigo-400 font-mono">{currentRole}</span>
                      </div>

                      <div className="space-y-0.5">
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('event-builder'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Event Website Builder</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('event-public'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                          <span>View Public Website</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('account'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Account Settings</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('staff'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Staff & Permissions</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('imports'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                          <span>Imports & Exports</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('audit-logs'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                          <span>Audit Trail Logs</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('orgs-subscription'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Plan & Subscription</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-700/60 mt-1 pt-1">
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('signin'); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-4 right-4 glass-popover rounded-2xl p-4 shadow-2xl border border-slate-700/80 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
                <span className="text-xs font-semibold text-slate-300">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium flex items-center gap-1.5 text-slate-200"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              {isPublicRoute ? (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('home'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/60"
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('features'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/60"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('pricing'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/60"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('event-public'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:bg-slate-800/60 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Sample Public Event Website</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
                    Workspace Navigation
                  </div>
                  {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setIsMobileMenuOpen(false); navigate(item.id); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/60 flex items-center gap-2.5"
                      >
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('event-public'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:bg-slate-800/60 flex items-center gap-2.5"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span>View Public Event Website</span>
                  </button>

                  <div className="border-t border-slate-700/60 pt-2 mt-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
                      Role Simulation
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {roles.map(r => (
                        <button
                          key={r}
                          onClick={() => { setCurrentRole(r); setIsMobileMenuOpen(false); }}
                          className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] truncate ${
                            currentRole === r ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
