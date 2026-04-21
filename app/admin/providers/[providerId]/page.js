'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  Building2,
  Plus,
  Search,
  BookOpen,
  Users,
  ChevronRight,
  Pencil,
  Trash2,
  Mail,
  UserSquare2,
  AlertTriangle,
} from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import AdminShell from '../../components/AdminShell';

const MIN_ROUTE_LOAD_MS = 1200;

/** Admin view of a single service provider: classrooms under the provider. */
export default function ProviderDetailPage() {
  const router = useRouter();
  const { providerId } = useParams();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [provider, setProvider] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', gradeLevel: '', schoolName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteProviderModal, setShowDeleteProviderModal] = useState(false);
  const [providerDeletePwd, setProviderDeletePwd] = useState('');
  const [deletingProvider, setDeletingProvider] = useState(false);

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
    if (!token || !providerId) return;
    fetchAll();
  }, [token, providerId]);

  const fetchAll = async () => {
    try {
      const [p, c] = await Promise.all([
        axios.get(`/api/admin/providers/${providerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/admin/providers/${providerId}/classrooms`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setProvider(p.data.provider);
      setClassrooms(c.data.classrooms || []);
      setUnassignedCount(c.data.unassignedStudentCount || 0);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load provider');
      }
    } finally {
      setLoaded(true);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', gradeLevel: '', schoolName: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      gradeLevel: c.gradeLevel || '',
      schoolName: c.schoolName || '',
      description: c.description || '',
    });
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
        await axios.patch(`/api/admin/classrooms/${editing._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Classroom updated');
      } else {
        await axios.post(
          `/api/admin/providers/${providerId}/classrooms`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Classroom created');
      }
      closeModal();
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    try {
      await axios.delete(`/api/admin/classrooms/${c._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Classroom removed');
      setDeleteConfirm(null);
      fetchAll();
    } catch {
      toast.error('Failed to delete classroom');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleDeleteProviderAccount = async (e) => {
    e.preventDefault();
    if (!providerDeletePwd.trim()) {
      toast.error('Enter your password to confirm');
      return;
    }
    setDeletingProvider(true);
    try {
      await axios.delete(`/api/auth/professors/${providerId}`, {
        data: { currentPassword: providerDeletePwd.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Provider account removed');
      setShowDeleteProviderModal(false);
      setProviderDeletePwd('');
      router.push('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete provider');
    } finally {
      setDeletingProvider(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.gradeLevel?.toLowerCase?.().includes(q) ||
        c.schoolName?.toLowerCase?.().includes(q)
    );
  }, [classrooms, searchQuery]);

  const ready = !!user && loaded;
  const showLoader = useMinLoadingGate(ready, MIN_ROUTE_LOAD_MS);

  if (!ready || showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading provider…" />
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

  const inputCls =
    'w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all';

  return (
    <AdminShell
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Admin', icon: LayoutDashboard, href: '/admin' },
        { label: provider.name || 'Provider', icon: Building2 },
      ]}
    >
      <div className="space-y-6">
        {/* Provider identity card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-base">{provider.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{provider.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {provider.email}
                </span>
                {provider.schoolId ? (
                  <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                    <UserSquare2 className="w-3.5 h-3.5" />
                    {provider.schoolId}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/providers/${provider._id}/students`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                All students ({provider.studentCount || 0})
              </Link>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                New classroom
              </button>
            </div>
          </div>
        </div>

        {/* Classrooms list */}
        <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Classrooms</h2>
              {unassignedCount > 0 ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  {unassignedCount} student{unassignedCount === 1 ? '' : 's'} not yet assigned to a classroom.
                </p>
              ) : null}
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search classrooms…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {searchQuery ? 'No classrooms match your search' : 'No classrooms yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={openCreate}
                  className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Create the first classroom
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {filtered.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Link
                    href={`/admin/providers/${provider._id}/classrooms/${c._id}/students`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-700 truncate">
                        {c.name}
                      </span>
                      {c.gradeLevel ? (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {c.gradeLevel}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 truncate">
                      {[c.schoolName, c.description].filter(Boolean).join(' · ') || 'No description'}
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Students</div>
                      <div className="text-sm font-bold text-slate-800 tabular-nums">{c.studentCount || 0}</div>
                    </div>
                    <Link
                      href={`/admin/providers/${provider._id}/classrooms/${c._id}/students`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Edit classroom"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete classroom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-red-900 tracking-tight">Delete provider account</h2>
              <p className="mt-1 text-xs text-red-900/80 leading-relaxed">
                Removes this service provider login. Classrooms and students in the database are not automatically removed.
                You must enter your admin password to confirm. This action cannot be done from the providers list.
              </p>
              <button
                type="button"
                onClick={() => {
                  setProviderDeletePwd('');
                  setShowDeleteProviderModal(true);
                }}
                className="mt-4 h-9 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete provider account…
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteProviderModal && (
        <Modal
          title="Confirm delete provider"
          onClose={() => {
            if (!deletingProvider) {
              setShowDeleteProviderModal(false);
              setProviderDeletePwd('');
            }
          }}
          size="sm"
        >
          <form onSubmit={handleDeleteProviderAccount} className="space-y-4 p-1">
            <p className="text-sm text-slate-600">
              Enter your <span className="font-semibold text-slate-800">admin account password</span> to permanently delete{' '}
              <span className="font-semibold text-slate-900">{provider?.name}</span>.
            </p>
            <div>
              <label htmlFor="delete-provider-pwd" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Your password
              </label>
              <input
                id="delete-provider-pwd"
                type="password"
                autoComplete="current-password"
                value={providerDeletePwd}
                onChange={(e) => setProviderDeletePwd(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="Current password"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingProvider}
                onClick={() => {
                  setShowDeleteProviderModal(false);
                  setProviderDeletePwd('');
                }}
                className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deletingProvider}
                className="h-9 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deletingProvider ? 'Deleting…' : 'Delete provider'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Edit classroom' : 'New classroom'}
          onClose={closeModal}
          size="sm"
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Room 204, Grade 4 Resource"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grade level</label>
                <input
                  type="text"
                  value={form.gradeLevel}
                  onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 4th"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">School</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  className={inputCls}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-y"
                placeholder="Optional notes about this classroom"
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
                {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete classroom"
          message={`Remove "${deleteConfirm.name}"? Students in this classroom will remain but become unassigned.`}
          type="danger"
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </AdminShell>
  );
}
