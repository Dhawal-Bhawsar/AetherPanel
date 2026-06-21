import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ReferralWithDetails, Survey } from '../types/database';
import { Search, ChevronLeft, ChevronRight, Filter, ArrowRight, CheckCircle, Clock, XCircle, Sparkles, Loader2 } from 'lucide-react';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [surveySelectReferral, setSurveySelectReferral] = useState<ReferralWithDetails | null>(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [completionReferral, setCompletionReferral] = useState<ReferralWithDetails | null>(null);
  const [payoutInput, setPayoutInput] = useState(500);

  useEffect(() => {
    loadReferrals();
    loadSurveys();
  }, []);

  async function loadReferrals() {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*, referrer:members(*), respondent:respondents(*), survey:surveys(*)')
      .order('created_at', { ascending: false });
    if (data) setReferrals(data as ReferralWithDetails[]);
    setLoading(false);
  }

  async function loadSurveys() {
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'active');
    if (data) setActiveSurveys(data);
  }

  async function updateReferralStatus(
    referral: ReferralWithDetails,
    newStatus: string,
    surveyId?: string,
    payoutAmount?: number
  ) {
    const prevPayout = Number(referral.payout_amount) || 0;
    const updates: Record<string, any> = { status: newStatus };

    if (newStatus === 'fit') {
      updates.fit_date = new Date().toISOString();
      if (surveyId) updates.survey_id = surveyId;
    }

    if (newStatus === 'completion') {
      updates.fit_date = referral.fit_date || new Date().toISOString();
      updates.completion_date = new Date().toISOString();
      updates.payout_amount = payoutAmount !== undefined ? payoutAmount : 500;
      if (surveyId) updates.survey_id = surveyId;
    }

    if (newStatus === 'rejected') {
      updates.payout_amount = 0;
    }

    try {
      // 1. Update referral status in DB
      const { error: refErr } = await supabase
        .from('referrals')
        .update(updates)
        .eq('id', referral.id);
      
      if (refErr) throw refErr;

      // 2. Adjust referrer's total earnings based on payout difference
      const finalPayout = Number(updates.payout_amount) || 0;
      const payoutChange = finalPayout - prevPayout;

      if (payoutChange !== 0 && referral.referrer_id) {
        const { data: member } = await supabase
          .from('members')
          .select('total_earnings')
          .eq('id', referral.referrer_id)
          .single();

        if (member) {
          const newEarnings = Number(member.total_earnings || 0) + payoutChange;
          await supabase
            .from('members')
            .update({ total_earnings: newEarnings })
            .eq('id', referral.referrer_id);
        }
      }

      // Close modals
      setSurveySelectReferral(null);
      setCompletionReferral(null);
      setSelectedSurveyId('');
      
      // Reload details
      loadReferrals();
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating status.');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return referrals.filter((r) => {
      const matchesSearch =
        !q ||
        (r.referral_code || '').toLowerCase().includes(q) ||
        (r.referrer?.name || '').toLowerCase().includes(q) ||
        (r.respondent?.name || '').toLowerCase().includes(q) ||
        (r.respondent?.email || '').toLowerCase().includes(q);
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [referrals, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = referrals.length;
    const leads = referrals.filter(r => r.status === 'lead').length;
    const fitReviews = referrals.filter(r => r.status === 'fit').length;
    const completions = referrals.filter(r => r.status === 'completion').length;
    return { total, leads, fitReviews, completions };
  }, [referrals]);

  function stageLabel(status: string) {
    switch (status) {
      case 'lead': return 'Lead';
      case 'fit': return 'Fit Match';
      case 'completion': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  function stageColor(status: string) {
    switch (status) {
      case 'lead': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'fit': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completion': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700/30';
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Referral Lifecycle
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Qualify panel leads, associate them to active survey projects, and manage payout triggers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search referrals..."
              className="w-full pl-10 pr-4 py-2 bg-[#0e1325]/60 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0f172a]">All Stages</option>
              <option value="lead" className="bg-[#0f172a]">Lead</option>
              <option value="fit" className="bg-[#0f172a]">Fit Review</option>
              <option value="completion" className="bg-[#0f172a]">Completed</option>
              <option value="rejected" className="bg-[#0f172a]">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mini Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Total Leads</div>
            <div className="text-xl font-bold text-white mt-0.5">{metrics.total}</div>
          </div>
          <Clock className="w-5 h-5 text-slate-500" />
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Awaiting Qualification</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{metrics.leads}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-500/80" />
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Active Survey Fits</div>
            <div className="text-xl font-bold text-blue-400 mt-0.5">{metrics.fitReviews}</div>
          </div>
          <Sparkles className="w-5 h-5 text-blue-500/80" />
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Settled & Completed</div>
            <div className="text-xl font-bold text-emerald-450 mt-0.5">{metrics.completions}</div>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500/80" />
        </div>
      </div>

      {/* Lifecycle Data Grid */}
      <div className="bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs uppercase font-bold tracking-wider text-slate-400">
                <th className="px-5 py-4">Referrer (Member)</th>
                <th className="px-5 py-4">Respondent Lead</th>
                <th className="px-5 py-4">Matched Project</th>
                <th className="px-5 py-4">Referral Code</th>
                <th className="px-5 py-4">Lifecycle Stage</th>
                <th className="px-5 py-4">Timeline</th>
                <th className="px-5 py-4">Incentive</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-550">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                    Refreshing referral tracking...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No referrals tracked.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/10 transition-colors duration-150 group">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{r.referrer?.name || '—'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.referrer?.email || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{r.respondent?.name || '—'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.respondent?.email || '—'}</div>
                      {r.respondent?.category && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                          {r.respondent.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold">
                      {r.survey?.title ? (
                        <div className="space-y-0.5">
                          <div>{r.survey.title}</div>
                          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">{r.survey.category}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not Matched</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                        {r.referral_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageColor(r.status)}`}>
                        {stageLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-550">
                        <span className={r.status !== 'lead' ? 'text-slate-400 font-semibold' : ''}>Lead</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span className={r.status === 'fit' || r.status === 'completion' ? 'text-slate-400 font-semibold' : ''}>Fit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span className={r.status === 'completion' ? 'text-emerald-450 font-bold' : ''}>Done</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Joined: {r.lead_date ? new Date(r.lead_date).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      ₹{Number(r.payout_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'lead' && (
                          <>
                            <button
                              onClick={() => { setSurveySelectReferral(r); setSelectedSurveyId(r.respondent?.category ? activeSurveys.find(s => s.category === r.respondent?.category)?.id || '' : ''); }}
                              className="px-2.5 py-1.5 bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              Qualify Fit
                            </button>
                            <button
                              onClick={() => updateReferralStatus(r, 'rejected')}
                              className="px-2.5 py-1.5 bg-red-600/10 border border-red-500/25 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'fit' && (
                          <button
                            onClick={() => { setCompletionReferral(r); setPayoutInput(500); }}
                            className="px-2.5 py-1.5 bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            Mark Complete
                          </button>
                        )}
                        {r.status === 'completion' && (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                            Paid Out
                          </span>
                        )}
                        {r.status === 'rejected' && (
                          <span className="text-[11px] font-bold text-red-400 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10">
                            Disqualified
                          </span>
                        )}
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

      {/* Modal: Qualify Fit / Select Survey */}
      {surveySelectReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Select Survey Alignment</h3>
              <button 
                onClick={() => setSurveySelectReferral(null)} 
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Match <strong>{surveySelectReferral.respondent?.name}</strong> (Industry: {surveySelectReferral.respondent?.category || 'Any'}) to an active survey project.
              </p>
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Projects</label>
                <select
                  value={selectedSurveyId}
                  onChange={(e) => setSelectedSurveyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="">Select a live project...</option>
                  {activeSurveys.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.category}] {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setSurveySelectReferral(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => updateReferralStatus(surveySelectReferral, 'fit', selectedSurveyId)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/10"
                >
                  Approve Fit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mark Complete / Payout prompt */}
      {completionReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Record Completion & Payout</h3>
              <button 
                onClick={() => setCompletionReferral(null)} 
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl space-y-1">
                <div className="text-xs text-violet-300 font-bold">Referral Details</div>
                <div className="text-xs text-slate-300">Referrer: {completionReferral.referrer?.name}</div>
                <div className="text-xs text-slate-300">Respondent: {completionReferral.respondent?.name}</div>
                <div className="text-xs text-slate-300">Survey Study: {completionReferral.survey?.title || 'None Selected'}</div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Payout Incentive Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={payoutInput}
                  onChange={(e) => setPayoutInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <p className="text-[10px] text-slate-500">
                  This value will be automatically credited to the referrer's (member's) account balance.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setCompletionReferral(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => updateReferralStatus(completionReferral, 'completion', completionReferral.survey_id || undefined, payoutInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-500/10"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
