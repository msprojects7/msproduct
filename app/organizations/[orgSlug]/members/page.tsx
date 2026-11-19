'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function OrganizationMembersPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { toast } = useToast();

  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Ownership transfer modal & confirmation
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState('');
  const [demoteRole, setDemoteRole] = useState<'admin' | 'member'>('admin');
  const [transferring, setTransferring] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const orgRes = await fetch(`/api/organizations/${orgSlug}`);
      if (!orgRes.ok) {
        router.push('/dashboard');
        return;
      }
      const orgData = await orgRes.json();
      setOrg(orgData.organization);
      setCurrentUserRole(orgData.effectiveRole);

      // Load members
      const membersRes = await fetch(`/api/organizations/${orgData.organization.id}/members`);
      if (membersRes.ok) {
        const memData = await membersRes.json();
        setMembers(memData.members || []);
      }

      // Load invitations
      const invRes = await fetch(`/api/organizations/${orgData.organization.id}/invitations`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData.invitations || []);
      }

      setLoading(false);
    } catch {
      toast.error('Failed to load organization members');
      setLoading(false);
    }
  }, [orgSlug, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!org) return;
    try {
      const res = await fetch(`/api/organizations/${org.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update member role');
      } else {
        toast.success('Member role updated successfully');
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred while updating role');
    }
  };

  const handleStatusToggle = async (memberId: string, currentStatus: boolean) => {
    if (!org) return;
    try {
      const res = await fetch(`/api/organizations/${org.id}/members/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update member status');
      } else {
        toast.success(`Member ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred while toggling status');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setInviting(true);
    setCreatedInviteUrl(null);

    try {
      const res = await fetch(`/api/organizations/${org.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create invitation');
      } else {
        setCreatedInviteUrl(data.inviteUrl);
        setInviteEmail('');
        toast.success('Invitation created successfully');
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred while sending invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!org) return;
    try {
      const res = await fetch(`/api/organizations/${org.id}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Invitation revoked successfully');
        loadData();
      } else {
        toast.error(data.error || 'Failed to revoke invitation');
      }
    } catch {
      toast.error('Network error while revoking invitation');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!org || !transferTargetUserId) return;
    setTransferring(true);

    try {
      const res = await fetch(`/api/organizations/${org.id}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: transferTargetUserId, demoteToRole: demoteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to transfer ownership');
      } else {
        toast.success('Ownership transferred successfully');
        setShowTransferModal(false);
        setShowTransferConfirm(false);
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred during ownership transfer');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Members &amp; Invitations…</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUserRole === 'org_owner';
  const isAdminOrOwner = currentUserRole === 'org_owner' || currentUserRole === 'org_admin';

  return (
    <div className="pb-20 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/organizations/${orgSlug}`}
              label={`Back to ${org?.name || 'Workspace'}`}
            />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Members &amp; Invitations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition"
              >
                Transfer Ownership
              </button>
            )}
            {isAdminOrOwner && (
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setCreatedInviteUrl(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite Member
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Members Table Card */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Workspace Members ({members.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Users with administrative or operational oversight in this organization
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">User Identifier</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  {isAdminOrOwner && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {m.userId}
                    </td>
                    <td className="px-6 py-4">
                      {m.role === 'owner' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Owner
                        </span>
                      ) : isAdminOrOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-400">{m.role}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          m.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                        }`}
                      >
                        {m.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    {isAdminOrOwner && (
                      <td className="px-6 py-4 text-right">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleStatusToggle(m.id, m.isActive)}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
                              m.isActive
                                ? 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-950/40'
                                : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {m.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invitations List Card */}
        {isAdminOrOwner && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Workspace Invitations ({invitations.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pending access invitations sent to colleagues or staff members
                </p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                No pending invitations found for this workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Invited Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Expires</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-xs">
                          {inv.email}
                        </td>
                        <td className="px-6 py-4 capitalize text-xs text-slate-600 dark:text-slate-300">
                          {inv.role}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              inv.status === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                : inv.status === 'accepted'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-xs font-semibold px-2.5 py-1 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite New Workspace Member</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate an invitation link or email invitation for an administrator or team member.
              </p>
            </div>

            {createdInviteUrl ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-emerald-900 block">
                  Invitation Created Successfully!
                </span>
                <p className="text-[11px] text-emerald-800">
                  Share this secure onboarding link with your team member:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteUrl}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg font-mono text-slate-800 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteUrl);
                      toast.success('Invitation link copied to clipboard!');
                    }}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setCreatedInviteUrl(null);
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@organization.com"
                    className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Workspace Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="member">Member (Can manage assigned events)</option>
                    <option value="admin">Administrator (Can manage organization &amp; create events)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs"
                  >
                    {inviting ? 'Generating…' : 'Generate Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Transfer Workspace Ownership</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Transfer primary account ownership to another active member.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select New Owner
                </label>
                <select
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                >
                  <option value="">Select a member…</option>
                  {members
                    .filter((m) => m.role !== 'owner' && m.isActive)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userId} ({m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your New Role After Transfer
                </label>
                <select
                  value={demoteRole}
                  onChange={(e) => setDemoteRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                >
                  <option value="admin">Administrator (Recommended)</option>
                  <option value="member">Member</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!transferTargetUserId}
                  onClick={() => setShowTransferConfirm(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Continue Transfer…
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Branded ConfirmDialog for Ownership Transfer */}
      <ConfirmDialog
        isOpen={showTransferConfirm}
        onClose={() => setShowTransferConfirm(false)}
        onConfirm={handleConfirmTransfer}
        title="Confirm Irreversible Ownership Transfer?"
        description={`You are about to transfer ownership of ${org?.name} to ${transferTargetUserId}. You will be demoted to ${demoteRole} and will no longer possess primary owner rights.`}
        confirmText="Confirm Transfer"
        variant="destructive"
        loading={transferring}
      />
    </div>
  );
}
