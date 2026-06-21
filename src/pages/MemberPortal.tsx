import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, ReferralWithDetails } from '../types/database';
import { Link2, CheckCircle, Clock, XCircle, AlertCircle, Copy, Check, LogOut, Loader2, Sparkles } from 'lucide-react';

export default function MemberPortal() {
  const [emailInput, setEmailInput] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Check persistent session
  useEffect(() => {
    const savedMemberId = localStorage.getItem('aether_portal_member_id');
    if (savedMemberId) {
      autoLogin(savedMemberId);
    }
  }, []);

  async function autoLogin(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedMember(data);
        loadReferrals(data.id);
      } else {
        localStorage.removeItem('aether_portal_member_id');
      }
    } catch (err) {
      console.error('Session restore failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setLoginLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', emailInput.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSelectedMember(data);
        localStorage.setItem('aether_portal_member_id', data.id);
        loadReferrals(data.id);
      } else {
        setError('No active panel member found with that email address.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadReferrals(memberId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*, respondent:respondents(*), survey:surveys(*)')
      .eq('referrer_id', memberId)
      .order('created_at', { ascending: false });
    if (data) setReferrals(data as ReferralWithDetails[]);
    setLoading(false);
  }

  function handleSignOut() {
    localStorage.removeItem('aether_portal_member_id');
    setSelectedMember(null);
    setReferrals([]);
    setEmailInput('');
    setError('');
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function stageIcon(status: string) {
    switch (status) {
      case 'lead': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'fit': return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'completion': return <CheckCircle className="w-4 h-4 text-emerald-450" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  }

  function stageText(status: string) {
    switch (status) {
      case 'lead': return 'Profile received — awaiting ops qualification';
      case 'fit': return 'Fit Match — respondent matched to active survey study';
      case 'completion': return 'Completed — survey study complete, incentive earned!';
      case 'rejected': return 'Disqualified — profile did not match target cohort';
      default: return status;
    }
  }

  if (loading && !selectedMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
        <span className="text-slate-400 text-sm">Verifying active session...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {!selectedMember ? (
        // Secure Portal Login Screen
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1325]/85 border border-slate-800/80 rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/10 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-white">Member Self-Service</h1>
              <p className="text-xs text-slate-450">
                Enter your email address to access your referral link, earnings, and lead progress.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Accessing...
                  </>
                ) : (
                  'Access Member Portal'
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Personalized Member Dashboard
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0e1325]/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">{selectedMember.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {selectedMember.status} Member
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {selectedMember.email} · {selectedMember.city || 'No Location'} · {selectedMember.category || 'Cohort Unassigned'}
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between md:justify-start gap-1">
                <div className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Total Earnings</div>
                <div className="text-2xl font-black text-emerald-400">₹{Number(selectedMember.total_earnings).toLocaleString()}</div>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div className="mt-6 space-y-2">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450">
                Your Shareable Referral Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-xs font-mono text-slate-300 truncate flex items-center">
                  {window.location.origin}/signup?ref={selectedMember.referral_code}
                </div>
                <button
                  onClick={() => copyLink(selectedMember.referral_code)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-violet-600/10 border-violet-500/25 text-violet-300 hover:bg-violet-550/25 hover:text-white'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied URL' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Referral Progress Grid */}
          <div className="bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-805/80 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Referral Pipeline Progress</h4>
                <p className="text-xs text-slate-400 mt-1">Track the live qualification status of your invitees.</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-all text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

            <div className="divide-y divide-slate-850/40">
              {loading ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                  Updating pipeline stats...
                </div>
              ) : referrals.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 space-y-2">
                  <Link2 className="w-8 h-8 mx-auto text-slate-700" />
                  <h4 className="text-slate-350 font-semibold text-sm">No referrals generated yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Share your unique link with friends or colleagues. When they register, they will appear in your console.
                  </p>
                </div>
              ) : (
                referrals.map((r) => (
                  <div key={r.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/5 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        {stageIcon(r.status)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm leading-snug">{r.respondent?.name || 'Incomplete Profile'}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {r.respondent?.email || '—'} · <span className="text-slate-500">{stageText(r.status)}</span>
                        </div>
                        {r.survey?.title && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-violet-400">Aligned Project:</span>
                            {r.survey.title}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                      <div className={`text-sm font-bold ${
                        r.status === 'completion' ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        ₹{Number(r.payout_amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Lead date: {r.lead_date ? new Date(r.lead_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
