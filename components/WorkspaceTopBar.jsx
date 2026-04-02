'use client';

/**
 * Same sticky top bar as the dashboard: left title "Dashboard", welcome + avatar right.
 * No product logo — sidebar already shows branding.
 */
export default function WorkspaceTopBar({ user }) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 hidden sm:inline">Welcome, {user?.name || '—'}</span>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ring-2 ring-white shrink-0">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary-700">{user?.name?.[0] || '?'}</span>
          )}
        </div>
      </div>
    </header>
  );
}
