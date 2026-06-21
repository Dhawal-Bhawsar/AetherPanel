import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Respondent, Member, Referral } from '../types/database';
import {
  Users, UserCheck, Link2, TrendingUp, Download,
  Plus, Search, Filter, ChevronLeft, ChevronRight, Edit3, Trash2, ShieldAlert, Award, Loader2
} from 'lucide-react';
import RespondentModal from '../components/RespondentModal';
import AICategorizeModal from '../components/AICategorizeModal';

export default function AdminDashboard() {
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const [editingRespondent, setEditingRespondent] = useState<Respondent | null>(null);
  const [showRespondentModal, setShowRespondentModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [r1, r2, r3] = await Promise.all([
      supabase.from('respondents').select('*').order('created_at', { ascending: false }),
      supabase.from('members').select('*'),
      supabase.from('referrals').select('*'),
    ]);
    if (r1.data) setRespondents(r1.data);
    if (r2.data) setMembers(r2.data);
    if (r3.data) setReferrals(r3.data);
    setLoading(false);
  }

  const cities = useMemo(() => Array.from(new Set(respondents.map((r) => r.city).filter((c): c is string => !!c))).sort(), [respondents]);
  const categories = useMemo(() => Array.from(new Set(respondents.map((r) => r.category).filter((c): c is string => !!c))).sort(), [respondents]);

  const filtered = useMemo(() => {
    return respondents.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q);
      const matchesCity = !cityFilter || r.city === cityFilter;
      const matchesCategory = !categoryFilter || r.category === categoryFilter;
      const matchesSource = !sourceFilter || r.source === sourceFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesCity && matchesCategory && matchesSource && matchesStatus;
    });
  }, [respondents, search, cityFilter, categoryFilter, sourceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const total = respondents.length;
    const active = respondents.filter((r) => r.status === 'active').length;
    const pending = respondents.filter((r) => r.status === 'pending').length;
    const referralCount = respondents.filter((r) => r.source === 'referral').length;
    const completionCount = referrals.filter((r) => r.status === 'completion').length;
    const totalEarnings = referrals
      .filter((r) => r.status === 'completion')
      .reduce((sum, r) => sum + (r.payout_amount || 0), 0);
    const categoryBreakdown: Record<string, number> = {};
    respondents.forEach((r) => {
      const c = r.category || 'Uncategorized';
      categoryBreakdown[c] = (categoryBreakdown[c] || 0) + 1;
    });
    return { total, active, pending, referralCount, completionCount, totalEarnings, categoryBreakdown };
  }, [respondents, referrals]);

  async function promoteToMember(respondent: Respondent) {
    if (respondent.status !== 'active') {
      alert('Only active respondents can be promoted to referral members.');
      return;
    }
    // Check if already a member
    const alreadyMember = members.some(m => m.email.toLowerCase() === respondent.email.toLowerCase());
    if (alreadyMember) {
      alert('This respondent is already registered as a referring member.');
      return;
    }

    setLoading(true);
    // Generate code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'REF';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const { error } = await supabase.from('members').insert({
        name: respondent.name,
        email: respondent.email,
        phone: respondent.phone,
        city: respondent.city,
        category: respondent.category,
        referral_code: code,
        status: 'active'
      });

      if (error) throw error;
      
      alert(`Success! Promoted ${respondent.name} to panel member.\nUnique Referral Code: ${code}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to promote member');
    } finally {
      setLoading(false);
    }
  }

  async function deleteRespondent(id: string) {
    if (!window.confirm('Are you sure you want to delete this respondent? This will clean up any referral links.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('respondents').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete respondent');
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Category', 'Source', 'Status', 'Notes', 'Created At'];
    const rows = filtered.map((r) => [
      r.name, r.email, r.phone || '', r.city || '', r.category || '', r.source, r.status, r.notes || '', r.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respondents_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Admin Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Overview of consumer panel participants, signup channels, and AI cohort categorization.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600/10 border border-violet-550/20 text-violet-300 rounded-xl text-sm font-semibold hover:bg-violet-500/25 transition-all"
          >
            AI Playground
          </button>
          <button
            onClick={() => { setEditingRespondent(null); setShowRespondentModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Respondent
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Panelists</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{metrics.total}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Panel</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{metrics.active}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Referral Leads</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{metrics.referralCount}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors"></div>
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Distributed Payouts</span>
          </div>
          <p className="text-3xl font-extrabold text-white">₹{metrics.totalEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Category Tag Cloud */}
      <div className="bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">Industry Segment Breakdown</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(metrics.categoryBreakdown).map(([cat, count]) => (
            <span
              key={cat}
              className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800/60 text-slate-300 text-xs font-semibold hover:border-violet-500/30 transition-all cursor-default"
            >
              {cat} <span className="text-violet-400 font-bold ml-1.5">{count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-[#0e1325]/60 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, location, phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Sources</option>
                <option value="baseline" className="bg-[#0f172a]">Baseline</option>
                <option value="referral" className="bg-[#0f172a]">Referral</option>
                <option value="direct" className="bg-[#0f172a]">Direct</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Statuses</option>
                <option value="active" className="bg-[#0f172a]">Active</option>
                <option value="pending" className="bg-[#0f172a]">Pending</option>
                <option value="inactive" className="bg-[#0f172a]">Inactive</option>
                <option value="rejected" className="bg-[#0f172a]">Rejected</option>
              </select>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-450">
          Showing {filtered.length} of {respondents.length} database entries
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs uppercase font-bold tracking-wider text-slate-400">
                <th className="px-5 py-4">Participant</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Cohort / Tags</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Notes</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                    Refreshing database records...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No participants matched search queries.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const isReferrerMember = members.some(m => m.email.toLowerCase() === r.email.toLowerCase());
                  
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/20 transition-colors duration-150 group">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{r.email}</div>
                        {r.phone && <div className="text-[10px] text-slate-500 mt-0.5">{r.phone}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-medium">
                        {r.city || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-slate-300 text-[11px] font-semibold">
                          {r.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                          r.source === 'referral' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          r.source === 'baseline' ? 'bg-slate-850 text-slate-400 border border-slate-750' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {r.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          r.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          r.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-slate-800/40 text-slate-400 border-slate-700/20'
                        }`}>
                          {r.status === 'rejected' && <ShieldAlert className="w-3.5 h-3.5" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-[180px] truncate text-xs" title={r.notes || ''}>
                        {r.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'active' && !isReferrerMember && (
                            <button
                              onClick={() => promoteToMember(r)}
                              className="px-2.5 py-1.5 bg-violet-600/10 border border-violet-500/25 hover:bg-violet-600 text-violet-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                              title="Promote participant to referring panel member"
                            >
                              <Award className="w-3.5 h-3.5" />
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingRespondent(r); setShowRespondentModal(true); }}
                            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-lg transition-colors"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRespondent(r.id)}
                            className="p-1.5 bg-slate-900 border border-slate-800 text-red-500 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-t border-slate-850">
          <div className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showRespondentModal && (
        <RespondentModal
          respondent={editingRespondent}
          onClose={() => { setShowRespondentModal(false); setEditingRespondent(null); }}
          onSaved={loadData}
        />
      )}
      {showAI && <AICategorizeModal onClose={() => setShowAI(false)} />}
    </div>
  );
}
