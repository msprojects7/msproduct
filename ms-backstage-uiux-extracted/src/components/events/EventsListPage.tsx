import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  Calendar, 
  Plus, 
  ArrowRight, 
  Users, 
  UserCheck, 
  CreditCard, 
  QrCode, 
  ExternalLink,
  MapPin,
  Clock
} from 'lucide-react';
import { EventStatus } from '../../types';

export const EventsListPage: React.FC = () => {
  const { events, currentOrg, setCurrentEventId, currentEvent, navigate } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const orgEvents = events.filter(e => e.orgId === currentOrg.id);
  const filteredEvents = orgEvents.filter(e => statusFilter === 'All' ? true : e.status === statusFilter);

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Event Directory</h1>
              <p className="text-xs text-slate-400">
                {currentOrg.name} · Multi-day summits, medical conferences & exhibitions
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('events-create')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit text-xs">
          {['All', 'Live', 'Published', 'Draft'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st} {st !== 'All' ? `(${orgEvents.filter(e => e.status === st).length})` : `(${orgEvents.length})`}
            </button>
          ))}
        </div>

        {/* EVENTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map(evt => {
            const isCurrent = evt.id === currentEvent.id;
            return (
              <div
                key={evt.id}
                className={`p-6 rounded-3xl glass-panel border flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-indigo-500 ring-1 ring-indigo-500/40 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      evt.status === 'Live'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : evt.status === 'Published'
                        ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {evt.status}
                    </span>
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{evt.attendeeCount} Delegates</span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">{evt.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{evt.timeZone}</span>
                    </div>
                  </div>

                  {/* Operational stats */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <span className="text-[10px] text-slate-400 block">Check-ins</span>
                      <span className="font-mono font-bold text-white">{evt.checkInCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <span className="text-[10px] text-slate-400 block">Prefix</span>
                      <span className="font-mono font-bold text-indigo-400">{evt.prefix}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50">
                      <span className="text-[10px] text-slate-400 block">Tiers</span>
                      <span className="font-mono font-bold text-white">{evt.categories.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        navigate('events-dashboard');
                      }}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        navigate('event-builder');
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Builder</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        navigate('event-public');
                      }}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Live Site</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentEventId(evt.id);
                      navigate('dashboard');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{isCurrent ? 'Active Workspace' : 'Open Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
