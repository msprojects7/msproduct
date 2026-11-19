import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  QrCode, 
  UserPlus, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { 
    currentOrg, 
    currentEvent, 
    events, 
    attendees, 
    navigate, 
    setCurrentEventId, 
    auditLogs,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  const totalRegistered = currentEvent.attendeeCount;
  const totalCheckedIn = currentEvent.checkInCount;
  const checkInRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;
  const badgesPrinted = attendees.filter(a => a.badgePrinted).length;
  const onSpotCount = attendees.filter(a => a.registrationType === 'On-spot').length;

  // Category counts
  const categoryCounts = currentEvent.categories.map(cat => ({
    name: cat,
    count: attendees.filter(a => a.category === cat).length
  }));

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP GREETING & CONTEXT STRIP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentOrg.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-indigo-400 font-semibold">{currentOrg.plan} Plan</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">Role: {currentRole}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Event Operations Hub
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('events-create')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
            <button
              onClick={() => navigate('events-dashboard')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>Event Details</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ACTIVE EVENT HERO CARD */}
        <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/40">
                  {currentEvent.status} Event
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Nov 18–20, 2026</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentEvent.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentEvent.description}
              </p>
              <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                <span className="text-slate-300 font-medium">{currentEvent.venue}</span>
                <span aria-hidden="true">·</span>
                <span>{currentEvent.timeZone}</span>
              </div>
            </div>

            {/* Quick Action Docklets for Staff and Managers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
              <button
                onClick={() => navigate('spot-registration')}
                className="p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">On-Spot Reg</div>
                <div className="text-[10px] text-indigo-300">Fast Counter</div>
              </button>

              <button
                onClick={() => navigate('scanner')}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center mb-2">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">QR Scanner</div>
                <div className="text-[10px] text-slate-400">Turnstiles</div>
              </button>

              <button
                onClick={() => navigate('badges')}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center mb-2">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">Badge Desk</div>
                <div className="text-[10px] text-slate-400">Print & Reprint</div>
              </button>

              <button
                onClick={() => navigate('badge-designer')}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">Designer</div>
                <div className="text-[10px] text-slate-400">10 Templates</div>
              </button>

              <button
                onClick={() => navigate('attendees')}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">Attendees</div>
                <div className="text-[10px] text-slate-400">Search & Filter</div>
              </button>

              <button
                onClick={() => navigate('reports')}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">Analytics</div>
                <div className="text-[10px] text-slate-400">Live Reports</div>
              </button>
            </div>
          </div>
        </div>

        {/* 4 PRIMARY OPERATIONAL METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Registrations</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold font-mono text-white tabular-nums">
              {totalRegistered.toLocaleString()}
            </p>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold font-mono tabular-nums">+{onSpotCount}</span>
              <span>walk-in on-spot today</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Gate Check-Ins</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {totalCheckedIn.toLocaleString()}
            </p>
            <div className="mt-2 text-[11px] text-slate-400">
              <span className="text-white font-mono font-semibold">{checkInRate}%</span> attendance rate
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Badges Printed</span>
              <CreditCard className="w-4 h-4 text-sky-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold font-mono text-white tabular-nums">
              {badgesPrinted.toLocaleString()}
            </p>
            <div className="mt-2 text-[11px] text-slate-400">
              <span>Ready at registration desk</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Turnstiles Checked Out</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold font-mono text-white tabular-nums">
              {currentEvent.checkOutCount.toLocaleString()}
            </p>
            <div className="mt-2 text-[11px] text-slate-400">
              <span>Temporary exits logged</span>
            </div>
          </div>
        </div>

        {/* 2-COLUMN SECTION: Live Activity & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Live Activity Stream */}
          <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Audit & Counter Stream
              </h3>
              <button 
                onClick={() => navigate('audit-logs')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Full Audit Trail</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{log.action.replace(/_/g, ' ')}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-indigo-300 font-mono text-[11px]">{log.targetRecord}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">{log.actor}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution Card */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Delegate Tiers
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Real-time breakdown of registered categories.
              </p>

              <div className="space-y-2.5">
                {categoryCounts.map((cat, i) => {
                  const pct = totalRegistered > 0 ? Math.round((cat.count / totalRegistered) * 100) : 0;
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 font-medium">{cat.name}</span>
                        <span className="font-mono text-slate-400">{cat.count} delegates ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => navigate('reports')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition-colors"
              >
                View Detailed Velocity Graphs
              </button>
            </div>
          </div>
        </div>

        {/* OTHER EVENTS LIST IN THIS ORGANIZATION */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                All Events in {currentOrg.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Switch active workspace or configure upcoming dates</p>
            </div>
            <button
              onClick={() => navigate('events-list')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Manage All Events ({events.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map(evt => (
              <div
                key={evt.id}
                onClick={() => setCurrentEventId(evt.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  evt.id === currentEvent.id
                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    evt.status === 'Live' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {evt.status}
                  </span>
                  <span className="font-mono text-slate-400">{evt.attendeeCount} pax</span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{evt.name}</h4>
                <p className="text-xs text-slate-400 truncate mt-1">{evt.venue}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
                  <span>{evt.id === currentEvent.id ? 'Active Workspace' : 'Select Workspace'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
