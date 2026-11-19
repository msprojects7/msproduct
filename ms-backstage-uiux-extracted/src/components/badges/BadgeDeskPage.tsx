import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Attendee } from '../../types';
import { 
  CreditCard, 
  Search, 
  Printer, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  CheckSquare,
  Square,
  Sliders,
  ChevronRight
} from 'lucide-react';

export const BadgeDeskPage: React.FC = () => {
  const { 
    attendees, 
    currentEvent, 
    navigate, 
    updateAttendee, 
    setSelectedBadgeAttendee, 
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Printed' | 'Unprinted'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewAttendee, setPreviewAttendee] = useState<Attendee | null>(null);

  const filtered = attendees
    .filter(a => a.eventId === currentEvent.id)
    .filter(a => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.registrationNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.company && a.company.toLowerCase().includes(q))
      );
    })
    .filter(a => {
      if (statusFilter === 'Printed') return a.badgePrinted;
      if (statusFilter === 'Unprinted') return !a.badgePrinted;
      return true;
    });

  const printedCount = attendees.filter(a => a.eventId === currentEvent.id && a.badgePrinted).length;
  const unprintedCount = attendees.filter(a => a.eventId === currentEvent.id && !a.badgePrinted).length;

  const handlePrintSingle = (att: Attendee) => {
    updateAttendee(att.id, { badgePrinted: true, printCount: att.printCount + 1 });
    setSelectedBadgeAttendee(att);
    addToast({
      type: 'success',
      title: 'Badge Print Job Created',
      message: `Opening print preview for ${att.fullName} (${att.registrationNumber}).`
    });
    navigate('print-preview');
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      const found = attendees.find(a => a.id === id);
      if (found) {
        updateAttendee(id, { badgePrinted: true, printCount: found.printCount + 1 });
      }
    });
    addToast({
      type: 'success',
      title: 'Batch Badges Queued',
      message: `${selectedIds.length} badges prepared for batch sheet printing.`
    });
    navigate('print-preview');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Badge Production Desk</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · Thermal roll & A4 sheet badge management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('badge-designer')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Badge Designer</span>
            </button>
            <button
              onClick={() => navigate('print-preview')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* 3 STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Delegates Roster</span>
            <p className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
              {attendees.filter(a => a.eventId === currentEvent.id).length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Badges Printed</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {printedCount}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Pending Print Clearance</span>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
              {unprintedCount}
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER STRIP */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search badge roster by name, reg #, or category..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'All' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('Unprinted')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'Unprinted' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unprinted ({unprintedCount})
              </button>
              <button
                onClick={() => setStatusFilter('Printed')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'Printed' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Printed ({printedCount})
              </button>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handlePrintSelected}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* BADGES ROSTER TABLE */}
        <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:text-white">
                    {selectedIds.length > 0 && selectedIds.length === filtered.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold">Reg #</th>
                <th className="py-3 px-3 font-semibold">Attendee Name</th>
                <th className="py-3 px-3 font-semibold">Tier Category</th>
                <th className="py-3 px-3 font-semibold">Affiliation</th>
                <th className="py-3 px-3 font-semibold">Badge Status</th>
                <th className="py-3 px-3 font-semibold">Print Count</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(att => {
                const isSelected = selectedIds.includes(att.id);
                return (
                  <tr key={att.id} className={`hover:bg-slate-900/50 ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => toggleSelectOne(att.id)} className="p-1 hover:text-white">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{att.registrationNumber}</td>
                    <td className="py-3 px-3 font-semibold text-white">{att.fullName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-medium text-slate-200">
                        {att.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{att.company || '—'}</td>
                    <td className="py-3 px-3">
                      {att.badgePrinted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Printed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          <Clock className="w-3 h-3" />
                          <span>Unprinted</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">{att.printCount}x</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintSingle(att)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          <span>{att.badgePrinted ? 'Reprint' : 'Print'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
