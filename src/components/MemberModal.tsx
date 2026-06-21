import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import type { Member } from '../types/database';

interface Props {
  member?: Member | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function MemberModal({ member, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [status, setStatus] = useState('active');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone || '');
      setCity(member.city || '');
      setCategory(member.category || '');
      setReferralCode(member.referral_code);
      setStatus(member.status);
      setTotalReferrals(member.total_referrals);
      setTotalEarnings(Number(member.total_earnings));
    } else {
      // Auto-generate code for a new member
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'REF';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setReferralCode(code);
    }
  }, [member]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check duplicate referral code or email (only on insert)
    if (!member) {
      const { data: existingEmail } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        setError('A member with this email address already exists.');
        setLoading(false);
        return;
      }

      const { data: existingCode } = await supabase
        .from('members')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (existingCode) {
        setError('This referral code is already in use.');
        setLoading(false);
        return;
      }
    }

    const memberData = {
      name,
      email,
      phone: phone || null,
      city: city || null,
      category: category || null,
      referral_code: referralCode,
      status,
      total_referrals: totalReferrals,
      total_earnings: totalEarnings,
    };

    try {
      if (member) {
        const { error: updateErr } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', member.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('members')
          .insert(memberData);
        if (insertErr) throw insertErr;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the member.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50">
          <h3 className="text-lg font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            {member ? 'Edit Member Details' : 'Add Panel Member'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!member}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99888 77665"
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                City / Location
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
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
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Referral Code
              </label>
              <input
                required
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="REF12345"
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Referrals
              </label>
              <input
                type="number"
                min="0"
                value={totalReferrals}
                onChange={(e) => setTotalReferrals(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Earnings (₹)
              </label>
              <input
                type="number"
                min="0"
                value={totalEarnings}
                onChange={(e) => setTotalEarnings(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-800/40 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : member ? 'Save Details' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
