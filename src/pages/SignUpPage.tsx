import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!refCode) {
      setError('Invalid or missing referral link. Please use a valid referral link from a panel member.');
      setLoading(false);
      return;
    }

    try {
      // Find the referrer
      const { data: referrer } = await supabase
        .from('members')
        .select('id, name')
        .eq('referral_code', refCode)
        .maybeSingle();

      if (!referrer) {
        setError('Invalid referral code. Please check the link with your referrer.');
        setLoading(false);
        return;
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('respondents')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        setError('This email address is already registered in our consumer panel.');
        setLoading(false);
        return;
      }

      // Create respondent
      const { data: newResp, error: respErr } = await supabase
        .from('respondents')
        .insert({
          name,
          email: email.trim().toLowerCase(),
          phone: phone || null,
          city: city || null,
          category: category || null,
          source: 'referral',
          status: 'pending',
        })
        .select()
        .single();

      if (respErr || !newResp) {
        throw new Error(respErr?.message || 'Failed to register profile. Please try again.');
      }

      // Create referral record
      const { error: refErr } = await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        respondent_id: newResp.id,
        referral_code: refCode,
        status: 'lead',
        lead_date: new Date().toISOString(),
      });

      if (refErr) throw refErr;

      // Update member total_referrals
      await supabase.rpc('increment_member_referrals', { member_id: referrer.id });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#070a13] bg-grid-pattern bg-gradient-glow flex items-center justify-center p-4">
        <div className="bg-[#0e1325]/85 border border-slate-800/80 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-5 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Registration Complete!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your profile has been submitted. The operations team will match you with active research panels, and your referrer has been credited!
          </p>
          <button
            onClick={() => navigate('/portal')}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-[0.98]"
          >
            Go to Member Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] bg-grid-pattern bg-gradient-glow flex items-center justify-center p-4">
      <div className="bg-[#0e1325]/85 border border-slate-800/80 rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Join the Consumer Panel
          </h1>
          <p className="text-xs text-slate-450 leading-relaxed">
            {refCode ? (
              <span>Referred by referral code: <strong className="text-violet-450 font-mono">{refCode}</strong></span>
            ) : (
              <span className="text-red-400 font-semibold">Please use a valid referral link to sign up.</span>
            )}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99999 88888"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Delhi"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Industry / Profession Segment</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">Select industry</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Retail">Retail</option>
              <option value="Technology">Technology</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Automotive">Automotive</option>
              <option value="Media">Media</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !refCode}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
