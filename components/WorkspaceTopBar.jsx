'use client';

import CollaborationNotificationsBell from '@/components/CollaborationNotificationsBell';

/**
 * Sticky top bar: left = optional custom node (e.g. breadcrumbs), else "Dashboard" title; welcome + avatar right.
 */
export default function WorkspaceTopBar({ user, left = null }) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-4">
      <div className="min-w-0 flex-1 flex items-center">
        {left ?? <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Dashboard</h2>}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {user?.role === 'professor' ? <CollaborationNotificationsBell /> : null}
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
