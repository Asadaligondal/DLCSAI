'use client';

import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';

/**
 * Shared chrome for admin pages: sidebar + top bar with breadcrumbs.
 */
export default function AdminShell({ user, breadcrumbs = [], onLogout, children }) {
  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        <WorkspaceTopBar
          user={user}
          left={<WorkspaceBreadcrumb items={breadcrumbs} className="mb-0" />}
        />
        <main className="p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
