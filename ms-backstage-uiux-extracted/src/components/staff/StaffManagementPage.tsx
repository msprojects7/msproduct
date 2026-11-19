import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { StaffMember, UserRole } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  Clock, 
  X,
  Sparkles
} from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const { staff, currentOrg, events, inviteStaff, deleteStaff, currentRole, setCurrentRole, openConfirm } = useApp();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Registration Staff');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([events[0]?.id || '']);

  const orgStaff = staff.filter(s => s.orgId === currentOrg.id);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    inviteStaff(name.trim(), email.trim(), role, selectedEvents);
    setShowInviteModal(false);
    setName('');
    setEmail('');
  };

  const handleDeleteStaff = (member: StaffMember) => {
    openConfirm({
      title: `Remove Staff Member?`,
      message: `Are you sure you want to revoke ${member.name}'s access credentials from ${currentOrg.name}?`,
      confirmLabel: 'Revoke Access',
      isDestructive: true,
      onConfirm: () => deleteStaff(member.id)
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
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Staff & Permissions</h1>
              <p className="text-xs text-slate-400">
                {currentOrg.name} · Role-based operational access for counter staff, turnstile scanners and managers
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* ROLE SIMULATION QUICK TESTING BAR */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Role Perspective in Prototype</span>
            </span>
            <p className="text-slate-400 text-[11px]">
              Currently previewing the system as: <span className="font-bold text-white">{currentRole}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['Platform Admin', 'Organization Owner', 'Event Manager', 'Registration Staff', 'Scanner Operator'] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => setCurrentRole(r)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors font-medium ${
                  currentRole === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {r.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* STAFF DIRECTORY TABLE */}
        <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Assigned Role</th>
                <th className="py-3 px-4 font-semibold">Assigned Workspaces</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {orgStaff.map(member => (
                <tr key={member.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-300 font-bold flex items-center justify-center border border-slate-700 text-xs">
                        {member.avatarText || 'ST'}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{member.name}</span>
                        <span className="text-[11px] text-slate-400">{member.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 font-medium font-mono text-[11px] border border-indigo-800/40">
                      {member.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    {member.assignedEventIds.length > 0 ? (
                      <span>{member.assignedEventIds.length} Event Assigned</span>
                    ) : (
                      <span className="text-slate-500">All Organization Events</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      member.status === 'Active'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    }`}>
                      {member.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{member.status}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {member.lastActiveAt || 'Pending invitation'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {member.role !== 'Organization Owner' && (
                      <button
                        onClick={() => handleDeleteStaff(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* INVITE STAFF MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />

            <div 
              role="dialog"
              className="relative w-full max-w-md rounded-3xl glass-popover p-6 shadow-2xl border border-slate-700/80 text-slate-100 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white tracking-tight">Invite Staff Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanya Sen"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@apexevents.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Operational Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Registration Staff">Registration Staff (On-Spot Counter & Badge Desk)</option>
                    <option value="Scanner Operator">Scanner Operator (Gate Optical Turnstiles)</option>
                    <option value="Event Manager">Event Manager (Full Event Operations)</option>
                    <option value="Platform Admin">Platform Admin (Cross-Tenant Systems)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
