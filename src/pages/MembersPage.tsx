import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types/database';
import { Search, ChevronLeft, ChevronRight, Copy, Check, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import MemberModal from '../components/MemberModal';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showModal, setShowModal] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (data) setMembers(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this panel member? This will remove their referral link eligibility.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete member');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.referral_code || '').toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function copyLink(code: string) {
    const url = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Panel Members
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage participating members who distribute referral codes and track their incentives.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 bg-[#0e1325]/60 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <button
            onClick={() => { setEditingMember(null); setShowModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98]"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs uppercase font-bold tracking-wider text-slate-400">
                <th className="px-5 py-4">Name / Contact</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Industry Category</th>
                <th className="px-5 py-4">Total Referrals</th>
                <th className="px-5 py-4">Earned Rewards</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Referral Link</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-550">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                    Refreshing members list...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No members matched criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/10 transition-colors duration-150 group">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{m.email}</div>
                      {m.phone && <div className="text-[10px] text-slate-500 mt-0.5">{m.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {m.city || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-slate-300 text-[11px] font-semibold">
                        {m.category || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-bold">
                      {m.total_referrals}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-450 font-bold">
                      ₹{Number(m.total_earnings).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        m.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-850 text-slate-400 border-slate-750'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => copyLink(m.referral_code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          copied === m.referral_code
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-violet-600/10 border-violet-500/25 text-violet-300 hover:bg-violet-550/25 hover:text-white'
                        }`}
                      >
                        {copied === m.referral_code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === m.referral_code ? 'Copied URL' : 'Copy Link'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => { setEditingMember(m); setShowModal(true); }}
                          className="p-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-250 rounded-lg hover:bg-slate-800 hover:border-slate-750 transition-colors"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 bg-slate-900 border border-slate-850 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-t border-slate-850">
          <div className="text-xs text-slate-400">Page {page} of {totalPages}</div>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-805 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-805 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <MemberModal
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null); }}
          onSaved={loadMembers}
        />
      )}
    </div>
  );
}
