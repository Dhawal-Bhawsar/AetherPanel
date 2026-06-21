import { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AICategorizeModal({ onClose }: Props) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function categorize() {
    setLoading(true);
    setError('');
    setResult(null);

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
        throw new Error(`Request failed (${response.status}): ${text}`);
      }

      const data = await response.json();
      if (data.category) {
        setResult(data.category);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Unexpected response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to categorize');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              AI Categorization Playground
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Type or paste unstructured notes about a participant. The AI will classify them into the most appropriate industry segment tag.
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="e.g., Works as an analyst at a retail bank, manages client portfolio..."
            className="w-full px-3.5 py-2.5 bg-slate-900/50 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
          />

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-550/15 animate-fade-in">
              <div className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Suggested Segment Tag</div>
              <div className="text-lg font-black text-white mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-violet-450" />
                {result}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/50">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl border border-slate-805 text-slate-300 text-sm font-medium hover:bg-slate-800/40"
            >
              Close
            </button>
            <button
              onClick={categorize}
              disabled={loading || !notes.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Categorize Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
