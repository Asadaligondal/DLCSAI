'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Building2, BookOpen, Users } from 'lucide-react';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import AdminShell from '../../../../../components/AdminShell';
import AdminStudentTable from '../../../../../components/AdminStudentTable';

const MIN_ROUTE_LOAD_MS = 1200;

/** Admin view: list students inside a specific classroom. */
export default function ClassroomStudentsPage() {
  const router = useRouter();
  const { providerId, classroomId } = useParams();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [classroom, setClassroom] = useState(null);
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

  useEffect(() => {
    if (!token || !classroomId) return;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          axios.get(`/api/admin/classrooms/${classroomId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/admin/classrooms/${classroomId}/students`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setClassroom(c.data.classroom);
        setStudents(s.data.students || []);
      } catch (error) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load classroom');
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, [token, classroomId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const ready = !!user && loaded;
  const showLoader = useMinLoadingGate(ready, MIN_ROUTE_LOAD_MS);

  if (!ready || showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading classroom…" />
      </div>
    );
  }

  if (notFound || !classroom) {
    return (
      <AdminShell
        user={user}
        onLogout={handleLogout}
        breadcrumbs={[
          { label: 'Admin', icon: LayoutDashboard, href: '/admin' },
          { label: 'Provider', icon: Building2, href: `/admin/providers/${providerId}` },
          { label: 'Classroom', icon: BookOpen },
        ]}
      >
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-8 text-center">
          <p className="text-sm text-slate-600">Classroom not found.</p>
          <Link
            href={`/admin/providers/${providerId}`}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 mt-2 inline-block"
          >
            Back to provider
          </Link>
        </div>
      </AdminShell>
    );
  }

  const providerName = classroom.providerId?.name || 'Provider';

  return (
    <AdminShell
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Admin', icon: LayoutDashboard, href: '/admin' },
        { label: providerName, icon: Building2, href: `/admin/providers/${providerId}` },
        { label: classroom.name, icon: BookOpen },
      ]}
    >
      <div className="space-y-6">
        {/* Classroom header card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">{classroom.name}</h1>
                {classroom.gradeLevel ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {classroom.gradeLevel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {[classroom.schoolName, classroom.description].filter(Boolean).join(' · ') ||
                  'No description'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Students</div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums flex items-center gap-1.5 justify-end">
                <Users className="w-5 h-5 text-primary-600" />
                {students.length}
              </div>
            </div>
          </div>
        </div>

        <AdminStudentTable
          students={students}
          emptyTitle="No students in this classroom yet"
          emptyHint="Assign students from the provider page, or have the provider move them in."
        />
      </div>
    </AdminShell>
  );
}
