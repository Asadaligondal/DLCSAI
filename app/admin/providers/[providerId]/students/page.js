'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Building2, Users } from 'lucide-react';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import AdminShell from '../../../components/AdminShell';
import AdminStudentTable from '../../../components/AdminStudentTable';

const MIN_ROUTE_LOAD_MS = 1200;

/** Admin view: every student under a provider, across classrooms + unassigned. */
export default function ProviderAllStudentsPage() {
  const router = useRouter();
  const { providerId } = useParams();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [provider, setProvider] = useState(null);
  const [students, setStudents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) {
      router.push('/login');
      return;
    }
    if (u.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(u);
    setToken(t);
  }, [router]);

  const refresh = async (t = token) => {
    try {
      const [p, s] = await Promise.all([
        axios.get(`/api/admin/providers/${providerId}`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
        axios.get(`/api/admin/providers/${providerId}/students`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
      ]);
      setProvider(p.data.provider);
      setStudents(s.data.students || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load students');
      }
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (!token || !providerId) return;
    refresh(token);
  }, [token, providerId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const ready = !!user && loaded;
  const showLoader = useMinLoadingGate(ready, MIN_ROUTE_LOAD_MS);

  if (!ready || showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading students…" />
      </div>
    );
  }

  if (notFound || !provider) {
    return (
      <AdminShell
        user={user}
        onLogout={handleLogout}
        breadcrumbs={[
          { label: 'Admin', icon: LayoutDashboard, href: '/admin' },
          { label: 'Provider', icon: Building2 },
          { label: 'Students', icon: Users },
        ]}
      >
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-8 text-center">
          <p className="text-sm text-slate-600">Provider not found.</p>
          <Link href="/admin" className="text-sm font-semibold text-primary-600 hover:text-primary-700 mt-2 inline-block">
            Back to providers
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Admin', icon: LayoutDashboard, href: '/admin' },
        { label: provider.name, icon: Building2, href: `/admin/providers/${providerId}` },
        { label: 'Students', icon: Users },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-5 flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">All students</h1>
            <p className="mt-0.5 text-xs text-slate-500 truncate">
              Every student owned by {provider.name}. To change case manager or classroom, open the student’s{' '}
              <span className="font-semibold text-slate-700">Profile</span> from the table.
            </p>
          </div>
        </div>

        <AdminStudentTable
          students={students}
          rosterOnlyView
          showCaseManagerCol
          showClassroomCol
          emptyTitle="No students yet"
          emptyHint="Ask this provider to add students, or import from a document."
        />
      </div>
    </AdminShell>
  );
}
