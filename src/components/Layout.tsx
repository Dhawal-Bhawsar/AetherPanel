import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Link2, UserCircle, FileText, Sparkles } from 'lucide-react';

const nav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/referrals', label: 'Referrals', icon: Link2 },
  { path: '/surveys', label: 'Surveys', icon: FileText },
  { path: '/portal', label: 'Member Portal', icon: UserCircle },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#070a13] bg-grid-pattern bg-gradient-glow flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1324]/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col fixed h-full z-30 transition-all duration-300">
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-slate-800/50 flex flex-col gap-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              AetherPanel
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-violet-500/80 mt-1">
            Referral Console
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'nav-link-active'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${
                  active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                }`} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Enterprise Portal</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800/80 text-slate-400 font-mono">
            v2.0
          </span>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col p-8 transition-all duration-300">
        <div className="max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
