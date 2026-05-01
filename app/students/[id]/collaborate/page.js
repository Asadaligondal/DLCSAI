'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, User, MessageSquare } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';
import StudentWorkspaceNav from '../components/StudentWorkspaceNav';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';

const MIN_ROUTE_LOAD_MS = 1200;

export default function StudentCollaboratePage() {
  const { id } = useParams();
  const router = useRouter();
  const [userLocal, setUserLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [posting, setPosting] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamDraft, setTeamDraft] = useState([]);
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setUserLocal(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [router]);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/students/${id}/collaboration`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayload(res.data);
      setTeamDraft(
        (res.data.collaborators || []).map((c) => ({
          userId: c.userId,
          roleKey: c.roleKey,
        }))
      );
    } catch (err) {
      const st = err.response?.status;
      toast.error(err.response?.data?.message || 'Could not load collaboration');
      if (st === 403 || st === 404) {
        router.replace('/dashboard/students');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLocal) return;
    load();
  }, [id, userLocal]);

  const restrictToCollaboration = useMemo(() => {
    if (!payload || !userLocal) return false;
    if (userLocal.role === 'admin') return false;
    const uid = String(userLocal.id || userLocal._id || '');
    return uid !== String(payload.primary?.id || '');
  }, [payload, userLocal]);

  const showLoader = useMinLoadingGate(!loading && !!payload, MIN_ROUTE_LOAD_MS, id);

  const handlePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const text = noteText.trim();
    if (!token || !text) return;
    setPosting(true);
    try {
      await axios.post(
        `/api/students/${id}/collaboration`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNoteText('');
      toast.success('Posted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post');
    } finally {
      setPosting(false);
    }
  };

  const handleSaveTeam = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingTeam(true);
    try {
      await axios.patch(
        `/api/students/${id}/collaboration`,
        { collaborators: teamDraft.filter((r) => r.userId && r.roleKey) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Team updated');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save team');
    } finally {
      setSavingTeam(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const professorOptions = payload?.professorOptions || [];
  const roleKeys = payload?.roleKeys || [];
  const roleLabels = payload?.roleLabels || {};

  if (!userLocal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading…" />
      </div>
    );
  }

  if (loading || !payload || showLoader) {
    return (
      <div className="flex h-screen bg-canvas">
        <Sidebar user={userLocal} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <IepGeniusLetterReveal subtitle="Loading team input…" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={userLocal} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <WorkspaceTopBar
          user={userLocal}
          left={
            <WorkspaceBreadcrumb
              items={[
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
                { label: 'Students', icon: Users, href: '/dashboard/students' },
                ...(restrictToCollaboration
                  ? [{ label: payload.studentName || 'Student', icon: User }]
                  : [{ label: payload.studentName || 'Student', icon: User, href: `/students/${id}` }]),
                { label: 'Team input', icon: MessageSquare },
              ]}
              className="mb-0"
            />
          }
        />

        <main className="p-6 lg:p-8 max-w-[720px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team input</h1>
            <p className="text-sm text-slate-500 mt-1">
              Share brief professional notes for <span className="font-semibold text-slate-700">{payload.studentName}</span>.
              Primary case manager:{' '}
              <span className="font-semibold text-slate-700">{payload.primary?.name || '—'}</span>. Full IEP editing stays on the
              primary&apos;s workspace.
            </p>
            </div>
            <StudentWorkspaceNav
              studentId={id}
              studentName={payload.studentName}
              restrictToCollaboration={restrictToCollaboration}
            />
          </div>

          {payload.canManageCollaborators ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setTeamOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50/80 transition-colors"
              >
                Manage team members
                <span className="text-slate-400 text-xs font-normal">{teamOpen ? 'Hide' : 'Show'}</span>
              </button>
              {teamOpen ? (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Invite other professor accounts. They can open this page only—not the full IEP unless they are the roster owner.
                  </p>
                  {teamDraft.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Provider</label>
                        <select
                          value={row.userId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTeamDraft((d) => d.map((x, i) => (i === idx ? { ...x, userId: v } : x)));
                          }}
                          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        >
                          <option value="">— Select —</option>
                          {professorOptions.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-52">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                        <select
                          value={row.roleKey}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTeamDraft((d) => d.map((x, i) => (i === idx ? { ...x, roleKey: v } : x)));
                          }}
                          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        >
                          {roleKeys.map((k) => (
                            <option key={k} value={k}>
                              {roleLabels[k] || k}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTeamDraft((d) => d.filter((_, i) => i !== idx))}
                        className="h-10 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200/80"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTeamDraft((d) => [...d, { userId: '', roleKey: roleKeys[0] || 'OTHER' }])}
                      className="h-9 px-3 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200/80"
                    >
                      Add member
                    </button>
                    <button
                      type="button"
                      disabled={savingTeam}
                      onClick={handleSaveTeam}
                      className="h-9 px-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                    >
                      {savingTeam ? 'Saving…' : 'Save team'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={handlePost} className="bg-white rounded-xl border border-slate-200/60 shadow-card p-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Your note</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Observations, recommendations, or coordination notes for the team…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-y min-h-[100px]"
            />
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-[11px] text-slate-400">{noteText.length}/4000</span>
              <button
                type="submit"
                disabled={posting || !noteText.trim()}
                className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
              >
                {posting ? 'Posting…' : 'Post note'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Thread</h2>
            {(payload.notes || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center bg-white rounded-xl border border-slate-200/60">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {(payload.notes || []).map((n) => (
                  <li
                    key={n._id || `${n.createdAt}-${n.author?.id}`}
                    className="bg-white rounded-xl border border-slate-200/60 shadow-card p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {n.author?.name || 'Unknown'}{' '}
                        <span className="font-normal text-slate-500">· {n.roleLabel}</span>
                      </div>
                      <time className="text-[11px] text-slate-400 tabular-nums">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </time>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
