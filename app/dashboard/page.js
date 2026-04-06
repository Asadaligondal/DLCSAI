"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';

export default function DashboardHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) {
      router.push('/login');
      return;
    }
    if (u.role === 'admin') {
      router.push('/professors');
      return;
    }
    setUser(u);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <WorkspaceTopBar
          user={user}
          left={
            <WorkspaceBreadcrumb
              items={[{ label: 'Dashboard', icon: LayoutDashboard }]}
              className="mb-0"
            />
          }
        />

        <main className="p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-0.5">Choose where to go next.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/students"
                className="group flex flex-col rounded-xl border border-slate-200/60 bg-white p-5 shadow-card hover:border-primary-200/80 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-primary-700">All students</h2>
                </div>
                <p className="text-sm text-slate-600 mb-4 flex-1">
                  View the student list, search, filter, and open IEP plans.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Go to table
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
