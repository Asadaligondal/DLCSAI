"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { History, Eye, Download, ChevronDown, FileText } from 'lucide-react';
import Modal from '@/components/Modal';
import { downloadFloridaIepPdf, getFloridaIepPdfBlobUrl } from '@/lib/floridaIepPdf';

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

/** Toolbar History control + Past Versions popover (sticky action bar). */
export default function IEPVersionHistory({ student, floridaIepLogo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfRevokeRef = useRef(null);
  const menuRef = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!viewEntry) {
      if (pdfRevokeRef.current) {
        pdfRevokeRef.current();
        pdfRevokeRef.current = null;
      }
      setPdfPreview(null);
      setPdfLoading(false);
      return;
    }

    if (pdfRevokeRef.current) {
      pdfRevokeRef.current();
      pdfRevokeRef.current = null;
    }
    setPdfPreview(null);

    const plan = mergePlanFromSnapshot(viewEntry);
    if (!plan || typeof plan !== 'object') {
      setPdfLoading(false);
      return;
    }

    let cancelled = false;
    setPdfLoading(true);

    const stamp = viewEntry.createdAt;
    const stampISO = stamp ? new Date(stamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    (async () => {
      try {
        const { url, revoke } = await getFloridaIepPdfBlobUrl(student, plan, {
          stampDate: stamp,
          fileName: `Florida_IEP_${(student.name || 'Student').replace(/\s+/g, '_')}_v${viewEntry.version}_${stampISO}.pdf`,
          logoUrl: floridaIepLogo || undefined
        });
        if (cancelled) {
          revoke();
          return;
        }
        pdfRevokeRef.current = revoke;
        setPdfPreview({ url });
      } catch {
        if (!cancelled) setPdfPreview(null);
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewEntry, student, floridaIepLogo]);

  useEffect(() => () => {
    if (pdfRevokeRef.current) {
      pdfRevokeRef.current();
      pdfRevokeRef.current = null;
    }
  }, []);

  const handleDownload = async (entry) => {
    const plan = mergePlanFromSnapshot(entry);
    if (!plan || typeof plan !== 'object') return;
    const stamp = entry.createdAt;
    const stampISO = stamp ? new Date(stamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    await downloadFloridaIepPdf(student, plan, {
      stampDate: stamp,
      fileName: `Florida_IEP_${(student.name || 'Student').replace(/\s+/g, '_')}_v${entry.version}_${stampISO}.pdf`,
      logoUrl: floridaIepLogo || undefined
    });
    setMenuOpen(false);
  };

  const openView = (entry) => {
    setViewEntry(entry);
    setMenuOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={`flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-semibold rounded-lg transition-colors border ${
          menuOpen
            ? 'text-violet-900 bg-violet-100 border-violet-300 shadow-sm'
            : 'text-violet-900 bg-violet-50 border-violet-200/80 hover:bg-violet-100/90'
        }`}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
      >
        <History className="w-3.5 h-3.5 shrink-0" />
        History
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 mt-1.5 w-[min(100vw-2rem,380px)] max-h-[min(70vh,440px)] flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-float z-[60] overflow-hidden"
          role="dialog"
          aria-label="Past versions"
        >
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/80">
            <h3 className="text-sm font-bold text-slate-900">Past Versions</h3>
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {!sorted.length ? (
              <div className="px-3.5 py-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">No versions yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Saved IEPs and completed generations will appear here with View and PDF.
                </p>
              </div>
            ) : (
              sorted.map((entry) => {
                const rowKey = entry._id ? String(entry._id) : `v${entry.version}-${entry.createdAt}`;
                const isMatchRow = matchRowId && rowKey === matchRowId;
                return (
                  <div
                    key={rowKey}
                    className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-slate-100 last:border-0 ${
                      isMatchRow ? 'bg-emerald-50/95' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isMatchRow ? 'text-emerald-900' : 'text-slate-900'}`}>
                        Version {entry.version}
                        {isMatchRow ? (
                          <span className="ml-1.5 font-bold tracking-wide text-emerald-700">(IN EDITOR)</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatWhen(entry.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => openView(entry)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(entry)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {viewEntry && (
        <Modal
          isOpen
          onClose={() => setViewEntry(null)}
          title={`Florida IEP — v${viewEntry.version} · ${formatWhen(viewEntry.createdAt)}`}
          size="xl"
          noScroll
        >
          <div className="px-6 pb-6 pt-0 flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-b border-slate-100 pb-3 mb-3 shrink-0">
              <div>
                <span className="font-semibold text-slate-700">Source:</span> {viewEntry.source || '—'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Reviewed (at snapshot):</span>{' '}
                {viewEntry.meta?.is_reviewed ? 'Yes' : 'No'}
              </div>
            </div>
            {pdfLoading && (
              <div className="py-16 text-center text-sm text-slate-500">Building PDF preview…</div>
            )}
            {!pdfLoading && pdfPreview && (
              <div className="h-[min(75vh,720px)] w-full bg-slate-100 rounded-lg overflow-hidden">
                <iframe title="Florida IEP PDF" src={pdfPreview.url} className="w-full h-full border-0" />
              </div>
            )}
            {!pdfLoading && !pdfPreview && (
              <p className="text-sm text-slate-500 py-8 text-center">Could not generate preview.</p>
            )}
            <p className="text-xs text-slate-500 mt-3 shrink-0">
              Use <strong>PDF</strong> on a version row to download the same file. Footer uses the capture date as plan date.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
