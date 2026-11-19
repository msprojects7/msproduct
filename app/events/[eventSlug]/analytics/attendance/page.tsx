'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  Users,
  Layers,
  RefreshCw,
  Loader2,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalAttendees: number;
    checkedIn: number;
    checkedOut: number;
    notCheckedIn: number;
    checkInRate: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    checkedIn: number;
    rate: number;
  }>;
  hourlyScans: Array<{
    hour: string;
    count: number;
  }>;
  sessionUtilization: Array<{
    id: string;
    title: string;
    room: string | null;
    capacity: number;
    attended: number;
    utilization: number | null;
  }>;
}

export default function AttendanceAnalyticsPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/analytics/attendance`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxHourlyCount = Math.max(1, ...(data?.hourlyScans.map((h) => h.count) || [1]));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span>Attendance & Footfall Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time attendee arrivals, category turnout rates, hourly footfall curves, and session room utilization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition flex items-center gap-2 text-xs shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <span className="text-xs">Computing attendance distribution...</span>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Confirmed Registrations
                </span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data.overview.totalAttendees}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Checked In (Footfall)
                </span>
                <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
                  {data.overview.checkedIn}
                </p>
              </div>

              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Pending Check-In
                </span>
                <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 mt-1">
                  {data.overview.notCheckedIn}
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Live Turnout Rate
                </span>
                <p className="text-2xl font-extrabold text-blue-800 dark:text-blue-300 mt-1">
                  {data.overview.checkInRate}%
                </p>
              </div>
            </div>

            {/* Middle Row: Hourly Curve + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Footfall Chart */}
              <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hourly Check-In Footfall</h2>
                </div>

                {data.hourlyScans.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-end gap-2 h-44 border-b border-slate-200 dark:border-slate-800 pb-2">
                      {data.hourlyScans.map((h, i) => {
                        const heightPct = Math.max(8, Math.round((h.count / maxHourlyCount) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-800 text-[10px] text-white px-2 py-0.5 rounded shadow pointer-events-none transition whitespace-nowrap z-10">
                              {h.count} check-ins ({h.hour})
                            </div>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-blue-600 hover:bg-blue-400 rounded-t transition-all duration-300"
                            />
                            <span className="text-[9px] text-slate-500 font-mono rotate-45 origin-left truncate max-w-[28px] mt-1">
                              {h.hour.split(' ')[1] || h.hour}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">Peak arrival timestamps based on scanner logs</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-8 text-center">No hourly check-ins recorded yet.</p>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Turnout Rate by Category</h2>
                </div>

                {data.categoryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {data.categoryBreakdown.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-900 dark:text-white font-semibold">{cat.category}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {cat.checkedIn} / {cat.total} ({cat.rate}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${cat.rate}%` }}
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-8 text-center">No categories recorded yet.</p>
                )}
              </div>
            </div>

            {/* Session Room Capacity & Utilization Table */}
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Session & Room Capacity Utilization</h2>
              </div>

              {data.sessionUtilization.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Session Title</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3">Attended Scans</th>
                        <th className="py-2.5 px-3">Room Capacity</th>
                        <th className="py-2.5 px-3">Utilization Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {data.sessionUtilization.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{sess.title}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{sess.room || 'Main Hall'}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{sess.attended}</td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {sess.capacity > 0 ? sess.capacity : 'Unlimited'}
                          </td>
                          <td className="py-2.5 px-3">
                            {sess.utilization !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${Math.min(100, sess.utilization)}%` }}
                                    className={`h-full rounded-full ${
                                      sess.utilization >= 100
                                        ? 'bg-red-500'
                                        : sess.utilization >= 80
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                    }`}
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                  {sess.utilization}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4">No scheduled sessions found for this event.</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">Failed to load analytics data.</p>
        )}
      </main>
    </div>
  );
}
