'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Building2, Users } from 'lucide-react';
import Modal from '@/components/Modal';
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
  const [moving, setMoving] = useState(null);
  const [moveTarget, setMoveTarget] = useState('');
  const [moveCaseManagerId, setMoveCaseManagerId] = useState('');
  const [professors, setProfessors] = useState([]);
  const [caseManagerClassrooms, setCaseManagerClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!token) return;
    axios
      .get('/api/auth/professors', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setProfessors(r.data.professors || []))
      .catch(() => setProfessors([]));
  }, [token]);

  useEffect(() => {
    if (!moving || !moveCaseManagerId || !token) {
      setCaseManagerClassrooms([]);
      return;
    }
    let cancelled = false;
    setLoadingClassrooms(true);
    axios
      .get(`/api/admin/providers/${moveCaseManagerId}/classrooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setCaseManagerClassrooms(res.data.classrooms || []);
      })
      .catch(() => {
        if (!cancelled) {
          setCaseManagerClassrooms([]);
          toast.error('Could not load classrooms for that case manager');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingClassrooms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moving, moveCaseManagerId, token]);

  useEffect(() => {
    if (!moving || !caseManagerClassrooms.length) return;
    const ok =
      !moveTarget || caseManagerClassrooms.some((c) => String(c._id) === String(moveTarget));
    if (!ok) setMoveTarget('');
  }, [moveCaseManagerId, caseManagerClassrooms, moving, moveTarget]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const openMove = (student) => {
    setMoving(student);
    const ownerId = String(student.createdBy?._id || student.createdBy || '');
    setMoveCaseManagerId(ownerId);
    setMoveTarget(student.classroomId?._id || student.classroomId || '');
  };

  const closeMove = () => {
    setMoving(null);
    setMoveTarget('');
    setMoveCaseManagerId('');
    setCaseManagerClassrooms([]);
  };

  const submitMove = async (e) => {
    e.preventDefault();
    if (!moving) return;
    if (!moveCaseManagerId) {
      toast.error('Select a case manager first');
      return;
    }
    setSubmitting(true);
    try {
      await axios.patch(
        `/api/admin/students/${moving._id}`,
        {
          caseManagerId: moveCaseManagerId,
          classroomId: moveTarget || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Student updated');
      closeMove();
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move student');
    } finally {
      setSubmitting(false);
    }
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
              Every student owned by {provider.name}, across classrooms and unassigned.
            </p>
          </div>
        </div>

        <AdminStudentTable
          students={students}
          showCaseManagerCol
          showClassroomCol
          emptyTitle="No students yet"
          emptyHint="Ask this provider to add students, or import from a document."
          onRowAction={openMove}
          actionLabel="Move"
        />
      </div>

      {moving && (
        <Modal title={`Assign ${moving.name}`} onClose={closeMove} size="sm">
          <form onSubmit={submitMove} className="space-y-4 p-1">
            <p className="text-sm text-slate-600">
              Choose the <span className="font-semibold text-slate-800">case manager</span> (roster owner), then a
              classroom under that account, or leave the classroom unassigned.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Case manager</label>
              <select
                value={moveCaseManagerId}
                onChange={(e) => {
                  setMoveCaseManagerId(e.target.value);
                  setMoveTarget('');
                }}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                required
              >
                <option value="">— Select case manager —</option>
                {professors.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                    {p.email ? ` (${p.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Classroom</label>
              <select
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
                disabled={!moveCaseManagerId || loadingClassrooms}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all disabled:opacity-50"
              >
                <option value="">
                  {!moveCaseManagerId
                    ? '— Select case manager first —'
                    : loadingClassrooms
                      ? 'Loading classrooms…'
                      : '— Unassigned —'}
                </option>
                {caseManagerClassrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.gradeLevel ? ` · ${c.gradeLevel}` : ''}
                  </option>
                ))}
              </select>
              {moveCaseManagerId && !loadingClassrooms && caseManagerClassrooms.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">No classrooms yet for this case manager — leave unassigned or add classrooms on their provider page.</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeMove}
                className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
