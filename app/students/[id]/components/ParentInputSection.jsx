'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link2, Loader2, Copy, Eye } from 'lucide-react';
import Modal from '@/components/Modal';

function formatShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return '—';
  }
}

export default function ParentInputSection({ studentId, readOnly }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/parent-input?studentId=${encodeURIComponent(studentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not load parent forms');
        return;
      }
      setItems(data.items || []);
    } catch {
      toast.error('Could not load parent forms');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) => i.status === filter);

  const handleGenerate = async () => {
    if (readOnly) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/parent-input', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not create link');
        return;
      }
      const url = data.item?.url;
      if (url && typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        toast.success('Link created and copied to clipboard');
      } else if (url) {
        toast.success(`Link created: ${url}`);
      } else {
        toast.success('Link created');
      }
      await load();
    } catch {
      toast.error('Could not create link');
    } finally {
      setGenerating(false);
    }
  };

  const copyUrlForItem = async (item) => {
    if (!item?.token) return;
    const path = `/parent-input/${item.token}`;
    const abs =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}${path}`
        : path;
    try {
      await navigator.clipboard.writeText(abs);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed — copy the link manually');
    }
  };

  return (
    <>
      <section className="mt-4 rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Parent input (IEP/EP/SP)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Share a link so parents can submit the state parent input form. You can review submissions here.
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-60 shrink-0"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Generate link
            </button>
          )}
        </div>

        <div className="mt-4 flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 w-fit">
          {['pending', 'submitted'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key === 'pending' ? 'Pending' : 'Submitted'}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[3rem]">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 border border-dashed border-slate-200 rounded-lg text-center">
              No {filter} parent forms yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">{formatShortDate(item.createdAt)}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="capitalize">{item.status}</span>
                    {item.status === 'submitted' && item.submittedAt && (
                      <>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span>Submitted {formatShortDate(item.submittedAt)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.status === 'pending' && item.token && !readOnly && (
                      <button
                        type="button"
                        onClick={() => copyUrlForItem(item)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy link
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Modal isOpen={Boolean(detail)} onClose={() => setDetail(null)} title="Parent input form" size="md">
        {detail && (
          <div className="space-y-3 text-sm text-slate-800 max-h-[70vh] overflow-y-auto pr-1">
            {detail.status === 'pending' ? (
              <p className="text-xs text-slate-600">
                Waiting for the parent to open the link and submit. Use &quot;Copy link&quot; in the list if you need
                the URL again.
              </p>
            ) : (
              <>
                <Field label="1. Child’s strengths" value={detail.strengths} />
                <Field label="2. Successes this year" value={detail.successesYear} />
                <Field label="3. Concerns" value={detail.concerns} />
                <Field label="4. Additional information or questions" value={detail.additional || '—'} />
                <Field label="Signature (name)" value={detail.parentSignerName} />
                <Field label="Date (as entered)" value={detail.parentFormDate || '—'} />
              </>
            )}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="h-9 px-4 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap rounded-md bg-slate-50 border border-slate-100 px-3 py-2">
        {value || '—'}
      </p>
    </div>
  );
}
