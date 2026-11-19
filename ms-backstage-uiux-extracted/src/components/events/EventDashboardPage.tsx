import React from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  Calendar, 
  MapPin, 
  Users, 
  UserCheck, 
  CreditCard, 
  QrCode, 
  UserPlus, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldAlert, 
  Settings, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  Clock,
  Globe
} from 'lucide-react';

export const EventDashboardPage: React.FC = () => {
  const { currentEvent, attendees, navigate } = useApp();

  const totalRegistered = currentEvent.attendeeCount;
  const checkInRate = totalRegistered > 0 ? Math.round((currentEvent.checkInCount / totalRegistered) * 100) : 0;

  const links = [
    { label: 'Attendee Directory', icon: Users, route: 'attendees', desc: `${totalRegistered} registered delegates` },
    { label: 'Spot Registration Desk', icon: UserPlus, route: 'spot-registration', desc: '15-second walk-in counter' },
    { label: 'Gate Turnstile Scanner', icon: QrCode, route: 'scanner', desc: `${currentEvent.checkInCount} check-ins recorded` },
    { label: 'Badge Production Desk', icon: CreditCard, route: 'badges', desc: 'Print & reprint passes' },
    { label: 'Interactive Designer', icon: Sparkles, route: 'badge-designer', desc: '10 custom template layouts' },
    { label: 'Event Website Builder', icon: Globe, route: 'event-builder', desc: 'Design microsite & agenda' },
    { label: 'Public Microsite', icon: ExternalLink, route: 'event-public', desc: 'Live delegate registration portal' },
    { label: 'Velocity Reports', icon: BarChart3, route: 'reports', desc: 'Real-time entry flow graphs' },
    { label: 'CSV / Excel Imports', icon: FileSpreadsheet, route: 'imports', desc: 'Batch attendee upload' },
    { label: 'Event Parameters', icon: Settings, route: 'events-settings', desc: 'Prefix & sequence settings' }
  ];

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Events List" targetRoute="events-list" />
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  {currentEvent.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {currentEvent.id}</span>
                <span className="text-xs text-indigo-400 font-mono">({currentEvent.eventType})</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">{currentEvent.name}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentEvent.venue} · {currentEvent.address}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('event-builder')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/50 flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website Builder</span>
            </button>
            <button
              onClick={() => navigate('event-public')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-sky-950/40 hover:bg-sky-900/60 border border-sky-700/50 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Site</span>
            </button>
            <button
              onClick={() => navigate('events-create')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Setup</span>
            </button>
            <button
              onClick={() => navigate('spot-registration')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>On-Spot Counter</span>
            </button>
          </div>
        </div>

        {/* 4 PRIMARY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Registered</span>
            <p className="mt-1 text-3xl font-extrabold font-mono text-white tabular-nums">
              {totalRegistered.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-indigo-400 font-mono">Prefix: {currentEvent.prefix}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Turnstile Check-ins</span>
            <p className="mt-1 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {currentEvent.checkInCount.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{checkInRate}% venue turnout</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Checked Out Exits</span>
            <p className="mt-1 text-3xl font-extrabold font-mono text-white tabular-nums">
              {currentEvent.checkOutCount.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Temporary pass-outs</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Tiers Configured</span>
            <p className="mt-1 text-3xl font-extrabold font-mono text-white tabular-nums">
              {currentEvent.categories.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Color-coded ribbons</p>
          </div>
        </div>

        {/* PROMINENT OPERATIONAL LINKS GRID */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Event Management Subsystems
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {links.map((link, idx) => {
              const Icon = link.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(link.route)}
                  className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{link.label}</h4>
                    <p className="text-xs text-slate-400 mt-1">{link.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
