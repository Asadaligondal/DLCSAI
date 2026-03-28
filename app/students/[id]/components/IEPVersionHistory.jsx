"use client";

import { useMemo, useState } from 'react';
import { History, Eye, Download, ChevronDown } from 'lucide-react';
import Modal from '@/components/Modal';
import { downloadFloridaIepPdf } from '@/lib/floridaIepPdf';

function mergePlanFromSnapshot(entry) {
  const snap = entry?.snapshot || {};
  return snap.user_edited_version || snap.original_ai_draft || {};
}

function mergePlanFromLiveStudent(student) {
  const d = student?.iep_plan_data || {};
  return d.user_edited_version || d.original_ai_draft || {};
}

function planContentEqual(a, b) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function formatWhen(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return '—';
  }
}

export default function IEPVersionHistory({ student, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [viewEntry, setViewEntry] = useState(null);

  const versions = student?.iep_version_history || [];
  const sorted = useMemo(
    () => [...versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [versions]
  );

  const livePlan = useMemo(() => mergePlanFromLiveStudent(student), [student]);
  const liveNonEmpty = useMemo(
    () => livePlan && typeof livePlan === 'object' && Object.keys(livePlan).length > 0,
    [livePlan]
  );

  const matchRowId = useMemo(() => {
    if (!liveNonEmpty) return null;
    for (const entry of sorted) {
      const snap = mergePlanFromSnapshot(entry);
      if (planContentEqual(snap, livePlan)) {
        return entry._id ? String(entry._id) : `v${entry.version}-${entry.createdAt}`;
      }
    }
    return null;
  }, [sorted, livePlan, liveNonEmpty]);

  const handleDownload = async (entry) => {
    const plan = mergePlanFromSnapshot(entry);
    if (!plan || typeof plan !== 'object') return;
    const stamp = entry.createdAt;
    const stampISO = stamp ? new Date(stamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    await downloadFloridaIepPdf(student, plan, {
      stampDate: stamp,
      fileName: `Florida_IEP_${(student.name || 'Student').replace(/\s+/g, '_')}_v${entry.version}_${stampISO}.pdf`
    });
  };

  const plaafpPreview = (entry) => {
    const plan = mergePlanFromSnapshot(entry);
    const t = plan?.plaafp_narrative || '';
    return t.length > 600 ? `${t.slice(0, 600)}…` : t;
  };

  if (!sorted.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <History className="w-4 h-4 text-slate-400" />
          IEP version history
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Saved IEPs and each completed generation are listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 text-primary-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-900">IEP version history</span>
          <span className="text-xs text-slate-500">({sorted.length} snapshot{sorted.length !== 1 ? 's' : ''})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <p className="text-xs text-slate-500 mt-3 mb-2">
            Newest entries first. The highlighted row matches what is in the editor when the content is unchanged.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-3 py-2">Ver.</th>
                  <th className="px-3 py-2">Captured</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Reviewed (then)</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((entry) => {
                  const rowKey = entry._id ? String(entry._id) : `v${entry.version}-${entry.createdAt}`;
                  const isMatchRow = matchRowId && rowKey === matchRowId;
                  const rowClass = isMatchRow
                    ? 'bg-emerald-50/90 ring-1 ring-inset ring-emerald-200/80 hover:bg-emerald-50'
                    : 'hover:bg-slate-50/80';
                  return (
                  <tr key={rowKey} className={rowClass}>
                    <td className="px-3 py-2 font-mono text-xs">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {entry.version}
                        {isMatchRow ? (
                          <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                            In editor
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatWhen(entry.createdAt)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {entry.source || 'save'}
                      </span>
                      {entry.label ? <span className="block text-xs text-slate-500 mt-0.5">{entry.label}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{entry.meta?.is_reviewed ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewEntry(entry)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 mr-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(entry)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewEntry && (
        <Modal
          isOpen
          onClose={() => setViewEntry(null)}
          title={`IEP snapshot v${viewEntry.version} · ${formatWhen(viewEntry.createdAt)}`}
          size="lg"
        >
          <div className="p-6 pt-0 max-h-[70vh] overflow-y-auto text-sm text-slate-800 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-b border-slate-100 pb-3">
              <div>
                <span className="font-semibold text-slate-700">Source:</span> {viewEntry.source || '—'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Reviewed (at snapshot):</span>{' '}
                {viewEntry.meta?.is_reviewed ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">PLAAFP (preview)</h4>
              <p className="whitespace-pre-wrap text-slate-800 bg-slate-50 rounded-lg p-3 border border-slate-100">
                {plaafpPreview(viewEntry) || '—'}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Use <strong>PDF</strong> in the table for a full Florida-format export using this snapshot (stamped with the capture date in the footer).
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
