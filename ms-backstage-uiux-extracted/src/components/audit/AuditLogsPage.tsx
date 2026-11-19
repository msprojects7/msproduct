import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { AuditLogItem } from '../../types';
import { 
  ShieldAlert, 
  Search, 
  Eye, 
  Clock, 
  X, 
  FileText, 
  Filter,
  CheckCircle2
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, currentEvent, currentOrg } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = auditLogs
    .filter(log => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetRecord.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    })
    .filter(log => actionFilter === 'All' ? true : log.action === actionFilter);

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Security & Audit Trails</h1>
              <p className="text-xs text-slate-400">
                Immutable chronological log of registrations, badge printing, scans, and system mutations
              </p>
            </div>
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
              placeholder="Search audit trail by actor, record, action, or keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Operations</option>
              <option value="ON_SPOT_REGISTRATION">On-Spot Registrations</option>
              <option value="ATTENDEE_CHECK_IN">Turnstile Check-Ins</option>
              <option value="BADGE_PRINTED">Badge Print Jobs</option>
              <option value="EVENT_STATUS_CHANGE">Event Status Transitions</option>
              <option value="BADGE_TEMPLATE_SAVED">Badge Template Edits</option>
            </select>
          </div>
        </div>

        {/* AUDIT LOGS TABLE */}
        <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Actor & Role</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Record</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{log.actor}</span>
                    <span className="text-[10px] text-indigo-400 font-mono">{log.actorRole}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-xs text-indigo-300">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200 truncate max-w-xs">
                    {log.targetRecord}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Inspect record details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOG DETAIL INSPECTOR MODAL */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setSelectedLog(null)} />

            <div 
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-md rounded-3xl glass-popover p-6 shadow-2xl border border-slate-700/80 text-slate-100 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-mono text-xs text-indigo-400 font-bold">{selectedLog.id}</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Audit Log Details</h3>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Operation</span>
                  <p className="font-mono font-bold text-indigo-300 text-sm">{selectedLog.action}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Actor</span>
                    <p className="font-semibold text-white mt-0.5">{selectedLog.actor}</p>
                    <p className="text-[10px] text-indigo-400 font-mono">{selectedLog.actorRole}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Client IP</span>
                    <p className="font-mono text-white mt-0.5">{selectedLog.ipAddress}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase mb-1">Target Record & Type</span>
                  <p className="font-semibold text-white">{selectedLog.targetRecord}</p>
                  <span className="font-mono text-[10px] text-slate-400">Entity: {selectedLog.targetType}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase mb-1">Detailed Description</span>
                  <p className="text-slate-300 leading-relaxed">{selectedLog.details}</p>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Recorded: {new Date(selectedLog.timestamp).toUTCString()}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
