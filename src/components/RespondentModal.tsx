import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react';
import type { Respondent } from '../types/database';

interface Props {
  respondent?: Respondent | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RespondentModal({ respondent, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('baseline');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (respondent) {
      setName(respondent.name);
      setEmail(respondent.email);
      setPhone(respondent.phone || '');
      setCity(respondent.city || '');
      setCategory(respondent.category || '');
      setSource(respondent.source);
      setStatus(respondent.status);
      setNotes(respondent.notes || '');
    }
  }, [respondent]);

  async function handleAICategorize() {
    if (!notes.trim()) return;
    setAiLoading(true);
    setAiFeedback('');
    setError('');

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-categorize`;
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI Edge Function error (${response.status}): ${text}`);
      }

      const data = await response.json();
      if (data.category) {
        setCategory(data.category);
        setAiFeedback(`AI suggested category: "${data.category}"`);
        setTimeout(() => setAiFeedback(''), 4000);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unexpected response structure.');
      }
    } catch (err: any) {
      setError(`AI suggestion failed: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check duplicate email (only for new respondents)
    if (!respondent) {
      const { data: existing } = await supabase
        .from('respondents')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        setError('A respondent with this email address already exists.');
        setLoading(false);
        return;
      }
    }

    const respondentData = {
      name,
      email,
      phone: phone || null,
      city: city || null,
      category: category || null,
      source,
      status,
      notes: notes || null,
    };

    try {
      if (respondent) {
        const { error: updateErr } = await supabase
          .from('respondents')
          .update(respondentData)
          .eq('id', respondent.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('respondents')
          .insert(respondentData);
        if (insertErr) throw insertErr;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the respondent.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50">
          <h3 className="text-lg font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            {respondent ? 'Edit Respondent Profile' : 'Add New Respondent'}
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
                placeholder="John Doe"
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
                disabled={!!respondent}
                placeholder="john@example.com"
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
                placeholder="+91 98765 43210"
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
                placeholder="Mumbai"
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
                Signup Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              >
                <option value="baseline">Baseline</option>
                <option value="referral">Referral Link</option>
                <option value="direct">Direct Organic</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Panel Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
            >
              <option value="active">Active Member</option>
              <option value="pending">Pending Validation</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected Profile</option>
            </select>
          </div>

          {/* Notes and AI Auto Categorizer */}
          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes & Background Details
              </label>
              <button
                type="button"
                onClick={handleAICategorize}
                disabled={aiLoading || !notes.trim()}
                className="flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Classify participant industry from notes using AI"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Auto-Categorize
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Provide background, job description, or research details to enable AI classification..."
              className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
            />
            {aiFeedback && (
              <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1.5 px-2.5 py-1 bg-violet-950 border border-violet-850 rounded-lg text-[11px] text-violet-300 animate-fade-in">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{aiFeedback}</span>
              </div>
            )}
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
              {loading ? 'Saving...' : respondent ? 'Save Profile' : 'Add Respondent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
