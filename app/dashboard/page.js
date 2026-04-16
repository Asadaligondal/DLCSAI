"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, ChevronRight, UserPlus, Upload, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import ActivityFeed from './components/ActivityFeed';

const MIN_ROUTE_LOAD_MS = 3000;

export default function DashboardHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);

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

  useEffect(() => {
    if (!user) return;
    const t = localStorage.getItem('token');
    if (!t) return;
    axios
      .get('/api/students', { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => setStudents(res.data.students || []))
      .catch(() => setStudents([]));
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const userReady = !!user;
  const showBlockingLoader = useMinLoadingGate(userReady, MIN_ROUTE_LOAD_MS);

  if (!userReady || showBlockingLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading…" />
      </div>
    );
  }

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
          <div className="max-w-[1400px] mx-auto">
            <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start space-y-6">
              <div className="space-y-6 min-w-0">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Choose where to go next.</p>
                </div>

                <div>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/students#add"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:border-primary-200/80 hover:bg-primary-50/40 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-primary-600 shrink-0" />
                      Add student
                    </Link>
                    <Link
                      href="/dashboard/students#import"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:border-primary-200/80 hover:bg-primary-50/40 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-primary-600 shrink-0" />
                      Import from document
                    </Link>
                    <Link
                      href="/dashboard/students#search"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:border-primary-200/80 hover:bg-primary-50/40 transition-colors"
                    >
                      <Search className="w-4 h-4 text-primary-600 shrink-0" />
                      Search students
                    </Link>
                  </div>
                </div>

                <Link
                  href="/dashboard/students"
                  className="group flex flex-col rounded-xl border border-slate-200/60 bg-white p-5 shadow-card hover:border-primary-200/80 hover:shadow-md transition-all max-w-md"
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

              <div className="min-w-0">
                <ActivityFeed students={students} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
