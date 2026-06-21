import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Survey } from '../types/database';
import { Search, Filter, Plus, Edit3, Trash2, Calendar, FileText } from 'lucide-react';
import SurveyModal from '../components/SurveyModal';

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    setLoading(true);
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSurveys(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this survey? This will detach it from any referral links.')) return;
    
    try {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;
      loadSurveys();
    } catch (err: any) {
      alert(err.message || 'Failed to delete survey');
    }
  }

  const categories = useMemo(() => {
    return Array.from(new Set(surveys.map((s) => s.category).filter((c): c is string => !!c))).sort();
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
      const matchesStatus = !statusFilter || s.status === statusFilter;
      const matchesCategory = !categoryFilter || s.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [surveys, search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Survey Projects
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage target studies and align referral leads to live client panels.
          </p>
        </div>
        <button
          onClick={() => { setEditingSurvey(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98]"
        >
          <Plus className="w-4.5 h-4.5" />
          Launch Survey
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0e1325]/60 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search surveys by title or keywords..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Industries</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/20 border border-slate-800/80 rounded-xl">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0f172a]">All Statuses</option>
                <option value="active" className="bg-[#0f172a]">Active Only</option>
                <option value="inactive" className="bg-[#0f172a]">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-[#0d1222]/30 border border-slate-800/50 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="bg-[#0e1325]/40 border border-slate-800/60 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-slate-200 font-bold">No Surveys Found</h4>
          <p className="text-xs text-slate-500 mt-1">
            Create a new survey study to start matching panel referrals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="group bg-[#0e1325]/50 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    survey.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
                  }`}>
                    {survey.status}
                  </span>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingSurvey(survey); setShowModal(true); }}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Survey"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Survey"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white leading-snug group-hover:text-violet-400 transition-colors duration-255">
                    {survey.title}
                  </h4>
                  <span className="inline-block px-2 py-0.5 mt-1.5 rounded bg-slate-800/60 text-slate-400 text-[11px] font-medium border border-slate-700/20">
                    {survey.category || 'Uncategorized'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {survey.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(survey.created_at).toLocaleDateString()}
                </span>
                <span className="font-mono text-[9px] text-slate-600">
                  ID: {survey.id.slice(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SurveyModal
          survey={editingSurvey}
          onClose={() => { setShowModal(false); setEditingSurvey(null); }}
          onSaved={loadSurveys}
        />
      )}
    </div>
  );
}
