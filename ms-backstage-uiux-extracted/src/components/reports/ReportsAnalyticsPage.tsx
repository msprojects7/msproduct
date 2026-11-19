import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserCheck, 
  CreditCard, 
  Download, 
  Calendar,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ReportsAnalyticsPage: React.FC = () => {
  const { currentEvent, attendees, addToast } = useApp();

  const [dateRange, setDateRange] = useState<'All Days' | 'Day 1' | 'Day 2' | 'Day 3'>('All Days');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const eventAttendees = attendees.filter(a => a.eventId === currentEvent.id);
  const totalRegistered = currentEvent.attendeeCount;
  const totalCheckedIn = currentEvent.checkInCount;
  const checkInRate = totalRegistered > 0 ? ((totalCheckedIn / totalRegistered) * 100).toFixed(1) : '0';
  const totalCheckedOut = currentEvent.checkOutCount;

  // Hourly velocity mock data
  const hourlyFlow = [
    { hour: '08:00 AM', count: 180, label: 'Early Keynote Entry' },
    { hour: '09:00 AM', count: 420, label: 'Peak Registration Rush' },
    { hour: '10:00 AM', count: 210, label: 'Colloquium Start' },
    { hour: '11:00 AM', count: 85, label: 'Coffee Track Break' },
    { hour: '12:00 PM', count: 40, label: 'Midday Sessions' },
    { hour: '01:00 PM', count: 25, label: 'Lunch Re-entry' },
    { hour: '02:00 PM', count: 24, label: 'Afternoon Panels' }
  ];

  // Payment status distribution
  const paidCount = eventAttendees.filter(a => a.paymentStatus === 'Paid').length;
  const compCount = eventAttendees.filter(a => a.paymentStatus === 'Complimentary').length;
  const pendingCount = eventAttendees.filter(a => a.paymentStatus === 'Pending').length;

  const handleExportReport = () => {
    addToast({
      type: 'success',
      title: 'Report Compiled',
      message: 'Comprehensive attendance & financial breakdown PDF exported.'
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Turnstile Analytics & Velocity</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · Real-time attendance percentage, gate velocity, and category distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report Summary</span>
            </button>
          </div>
        </div>

        {/* 4 KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Registered</span>
            <p className="mt-2 text-3xl font-extrabold font-mono text-white tabular-nums">
              {totalRegistered.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">100% capacity baseline</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Turnstile Check-In Rate</span>
            <p className="mt-2 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {checkInRate}%
            </p>
            <p className="mt-1 text-[11px] text-emerald-400 font-medium font-mono">{totalCheckedIn} delegates inside venue</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Temporary Exits</span>
            <p className="mt-2 text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {totalCheckedOut.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">Logged at exit turnstiles</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Peak Gate Velocity</span>
            <p className="mt-2 text-3xl font-extrabold font-mono text-indigo-400 tabular-nums">
              420 / hr
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">Recorded 09:00 - 10:00 AM</p>
          </div>
        </div>

        {/* HOURLY VELOCITY BAR CHART */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Hourly Gate Turnstile Velocity</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Attendee arrivals logged across gate scanning stations</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filter Day:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium"
              >
                <option value="All Days">All Days Combined</option>
                <option value="Day 1">Day 1 (Keynote & Plenary)</option>
                <option value="Day 2">Day 2 (Workshops & Expo)</option>
              </select>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2 space-y-3">
            {hourlyFlow.map((slot, i) => {
              const maxCount = 420;
              const widthPct = Math.round((slot.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300 font-medium w-20">{slot.hour}</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">{slot.label}</span>
                    <span className="font-mono font-bold text-white tabular-nums">{slot.count} scanned</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(6, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-COLUMN SECTION: CATEGORY DISTRIBUTION & PAYMENT RECONCILIATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CATEGORY BREAKDOWN */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Category Attendance Distribution</span>
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              {currentEvent.categories.map((cat, idx) => {
                const totalInCat = eventAttendees.filter(a => a.category === cat).length;
                const checkedInCat = eventAttendees.filter(a => a.category === cat && a.attendanceStatus === 'Checked In').length;
                const pct = totalInCat > 0 ? Math.round((checkedInCat / totalInCat) * 100) : 0;

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{cat}</span>
                      <span className="font-mono text-slate-300">{checkedInCat} of {totalInCat} checked in ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAYMENT RECONCILIATION */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Counter Payment Status</span>
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold block">Paid Registrations</span>
                  <span className="text-[11px] text-slate-400">Online gateway & on-spot POS counter</span>
                </div>
                <span className="font-mono text-lg font-bold text-white">{paidCount}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-indigo-400 font-bold block">Complimentary & Faculty Pass</span>
                  <span className="text-[11px] text-slate-400">VIP delegates, speakers & sponsors</span>
                </div>
                <span className="font-mono text-lg font-bold text-white">{compCount}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold block">Payment Pending Verification</span>
                  <span className="text-[11px] text-slate-400">Wire transfer or physical desk cheque</span>
                </div>
                <span className="font-mono text-lg font-bold text-white">{pendingCount}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
