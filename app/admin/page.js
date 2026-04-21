'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  Plus,
  Search,
  Building2,
  Users,
  BookOpen,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import Modal from '@/components/Modal';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import AdminShell from './components/AdminShell';

const MIN_ROUTE_LOAD_MS = 1200;

/**
 * Admin dashboard: list of service providers with classroom + student counts.
 * Admin can create / edit / remove provider accounts (professor users) here.
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [providers, setProviders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', schoolId: '' });
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

  useEffect(() => {
    if (!token) return;
    fetchProviders();
  }, [token]);

  const fetchProviders = async () => {
    try {
      const res = await axios.get('/api/admin/providers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(res.data.providers || []);
    } catch {
      toast.error('Failed to load providers');
    } finally {
      setLoaded(true);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', schoolId: '' });
    setShowModal(true);
  };

  const openEdit = (prov) => {
    setEditing(prov);
    setForm({ name: prov.name, email: prov.email, password: '', schoolId: prov.schoolId || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`/api/auth/professors/${editing._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Provider updated');
      } else {
        await axios.post(
          '/api/auth/register',
          { ...form, role: 'professor' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Provider created');
      }
      closeModal();
      fetchProviders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.schoolId?.toLowerCase?.().includes(q)
    );
  }, [providers, searchQuery]);

  const totals = useMemo(
    () => ({
      providers: providers.length,
      classrooms: providers.reduce((sum, p) => sum + (p.classroomCount || 0), 0),
      students: providers.reduce((sum, p) => sum + (p.studentCount || 0), 0),
    }),
    [providers]
  );

  const ready = !!user && loaded;
  const showLoader = useMinLoadingGate(ready, MIN_ROUTE_LOAD_MS);

  if (!ready || showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading admin…" />
      </div>
    );
  }

  const inputCls =
    'w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all';

  return (
    <AdminShell
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[{ label: 'Admin', icon: LayoutDashboard }]}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage service providers, classrooms, and student rosters.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add provider
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Building2} label="Providers" value={totals.providers} />
          <StatCard icon={BookOpen} label="Classrooms" value={totals.classrooms} />
          <StatCard icon={Users} label="Students" value={totals.students} />
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-900">Service providers</h2>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search providers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">School ID</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Classrooms</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Students</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-300" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          {searchQuery ? 'No providers match your search' : 'No providers yet'}
                        </span>
                        {!searchQuery && (
                          <button
                            onClick={openCreate}
                            className="mt-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                          >
                            Add your first provider
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/providers/${p._id}`}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-xs">{p.name?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-700 truncate">
                            {p.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 truncate max-w-[280px]">{p.email}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 font-mono tabular-nums">
                        {p.schoolId || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700 tabular-nums">
                        {p.classroomCount || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700 tabular-nums">
                        {p.studentCount || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/providers/${p._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 mr-1 px-2 py-1 rounded hover:bg-primary-50"
                          >
                            Open <ChevronRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="Edit provider"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit provider' : 'Add provider'} onClose={closeModal} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password {editing && <span className="text-slate-400 font-normal">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
                required={!editing}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                School ID <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.schoolId}
                onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {submitting ? 'Saving…' : editing ? 'Update' : 'Add provider'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
