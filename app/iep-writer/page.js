'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
  FileText,
  Trash2,
  Plus,
  Search,
  FolderOpen,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';

const CONTEXT_OPTIONS = [
  { value: 'institutional', label: 'Institutional Documents', hint: 'Goal bank, district policies' },
  { value: 'student_evaluation', label: 'Student Evaluations', hint: 'Reports and assessments' },
  { value: 'state_regulation', label: 'State Regulations', hint: 'Rules and legal references' },
];

function fileTypeLabel(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.docx')) return 'DOCX';
  if (lower.endsWith('.pdf')) return 'PDF';
  return 'File';
}

function matchesSearch(item, q) {
  if (!q) return true;
  const hay = `${item.title || ''} ${item.description || ''} ${item.subtitle || ''}`.toLowerCase();
  return hay.includes(q);
}

function docToCard(d) {
  return {
    id: d.id,
    title: d.originalFilename || d.name,
    description:
      d.description ||
      (d.status === 'ready'
        ? `${d.chunkCount || 0} context chunks indexed for RAG`
        : d.status === 'processing'
          ? 'Processing…'
          : d.errorMessage || d.status),
    type: fileTypeLabel(d.originalFilename),
    active: d.active !== false,
    status: d.status,
    raw: d,
  };
}

export default function IEPWriterPage() {
  const router = useRouter();
  const menuRef = useRef(null);
  const [user, setUser] = useState({ name: 'Guest' });
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('institutional');
  const [newDescription, setNewDescription] = useState('');
  const [addFile, setAddFile] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const q = search.trim().toLowerCase();

  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
      fetchDocuments();
    } catch {
      /* ignore */
    }
  }, [fetchDocuments]);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const patchDocument = async (id, body) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) await fetchDocuments();
    return res.ok;
  };

  const handleToggleActive = async (doc, next) => {
    if (doc.status !== 'ready') return;
    const prevActive = doc.active !== false;
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, active: next } : d))
    );
    const ok = await patchDocument(doc.id, { active: next });
    if (!ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, active: prevActive } : d))
      );
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchDocuments();
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addFile) {
      setUploadError('Choose a PDF or DOCX file');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', addFile);
      formData.append('contextCategory', newCategory);
      if (newDescription.trim()) formData.append('description', newDescription.trim());
      const token = localStorage.getItem('token');
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.message || 'Upload failed');
        return;
      }
      setAddModalOpen(false);
      setAddFile(null);
      setNewDescription('');
      setNewCategory('institutional');
      await fetchDocuments();
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const institutionalDocs = useMemo(
    () => documents.filter((d) => (d.contextCategory || 'institutional') === 'institutional'),
    [documents]
  );
  const studentReal = useMemo(
    () => documents.filter((d) => d.contextCategory === 'student_evaluation'),
    [documents]
  );
  const stateReal = useMemo(
    () => documents.filter((d) => d.contextCategory === 'state_regulation'),
    [documents]
  );

  const institutionalCards = useMemo(
    () => institutionalDocs.map(docToCard),
    [institutionalDocs]
  );

  const studentCards = useMemo(() => studentReal.map(docToCard), [studentReal]);

  const stateCards = useMemo(() => stateReal.map(docToCard), [stateReal]);

  const filterCards = (cards) => cards.filter((c) => matchesSearch(c, q));

  const instFiltered = filterCards(institutionalCards);
  const studentFiltered = filterCards(studentCards);
  const stateFiltered = filterCards(stateCards);

  const totalUploaded = documents.length;
  const activeContexts = useMemo(
    () => documents.filter((d) => d.status === 'ready' && d.active !== false).length,
    [documents]
  );

  const renderToggle = (card) => {
    const disabled = card.status !== 'ready';
    const checked = card.active;

    const onChange = () => {
      if (card.raw) handleToggleActive(card.raw, !checked);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-2 ${
          checked && !disabled ? 'bg-brand-cta' : 'bg-slate-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    );
  };

  const renderCard = (card) => (
    <div
      key={card.id}
      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 min-h-[140px]"
    >
      <div className="flex justify-between gap-2 items-start">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-brand-body leading-snug line-clamp-2">{card.title}</h4>
          <p className="text-xs text-brand-body/70 mt-1.5 leading-relaxed line-clamp-3">{card.description}</p>
        </div>
        <div className="relative shrink-0" ref={openMenuId === card.id ? menuRef : null}>
          <button
            type="button"
            className="p-1.5 rounded-lg text-brand-body/50 hover:bg-slate-100 hover:text-brand-body"
            aria-label="More"
            onClick={() => setOpenMenuId((v) => (v === card.id ? null : card.id))}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {openMenuId === card.id && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                disabled={deletingId === card.id}
                onClick={() => handleDelete(card.id)}
              >
                {deletingId === card.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border border-slate-200 text-brand-body/70">
          {card.type}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-brand-body/80">Active</span>
          {renderToggle(card)}
        </div>
      </div>
    </div>
  );

  const renderSection = (title, subtitle, count, cards, hasSearch) => (
    <section className="rounded-2xl bg-slate-100/70 border border-slate-200/60 p-4 sm:p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-sm shrink-0">
            <FolderOpen className="w-5 h-5 text-brand-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-brand-body">{title}</h3>
              <span className="text-xs font-semibold text-brand-body/60 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {count}
              </span>
            </div>
            {subtitle && <p className="text-xs text-brand-body/65 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">{cards.map(renderCard)}</div>
      {cards.length === 0 && (
        <div className="text-center py-10 px-4 text-sm text-brand-body/50 bg-white/60 rounded-xl border border-dashed border-slate-200">
          {hasSearch ? (
            'No items match your search.'
          ) : (
            <>
              No documents in this section yet.
              <span className="block text-xs text-brand-body/45 mt-1.5">
                Use &quot;Add New Context&quot; and choose this context type to upload a PDF or DOCX.
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex h-screen bg-[#f6f7f9] text-brand-body">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-6 sm:px-8 h-16 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-hero/15 flex items-center justify-center shrink-0">
              <FileText className="w-[18px] h-[18px] text-brand-hero" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-brand-body tracking-tight truncate">IEP Writer</h2>
              <p className="text-xs text-brand-body/55 truncate">Knowledge base &amp; RAG contexts</p>
            </div>
          </div>
        </header>

        <main className="p-6 sm:p-8 flex-1 max-w-6xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-body tracking-tight">
                Knowledge Base &amp; Contexts
              </h1>
              <p className="text-sm text-brand-body/70 mt-1">
                Total uploaded documents:{' '}
                <span className="font-semibold text-brand-body">{totalUploaded}</span>
                <span className="mx-2 text-brand-body/40">|</span>
                Active contexts:{' '}
                <span className="font-semibold text-brand-emerald">{activeContexts}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-brand-cta hover:bg-brand-cta-hover rounded-xl shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add New Context
            </button>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-body/40" />
            <input
              type="search"
              placeholder="Search context…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-brand-body placeholder:text-brand-body/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-cta/30 focus:border-brand-cta"
            />
          </div>

          {uploadError && !addModalOpen && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{uploadError}</p>
          )}

          {renderSection(
            'Institutional Documents',
            'Goal bank and district or policy PDFs and DOCX files used for RAG.',
            instFiltered.length,
            instFiltered,
            Boolean(q)
          )}

          {renderSection(
            'Student Evaluations',
            'Evaluation reports and assessments uploaded as this context type.',
            studentFiltered.length,
            studentFiltered,
            Boolean(q)
          )}

          {renderSection(
            'State Regulations',
            'Rules, standards, and legal references uploaded as this context type.',
            stateFiltered.length,
            stateFiltered,
            Boolean(q)
          )}
        </main>
      </div>

      <Modal
        isOpen={addModalOpen}
        onClose={() => !uploading && setAddModalOpen(false)}
        title="Add new context"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {uploadError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{uploadError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-body mb-1.5">Context type</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm text-brand-body bg-white focus:outline-none focus:ring-2 focus:ring-brand-cta/30"
            >
              {CONTEXT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-brand-body/55 mt-1">
              {CONTEXT_OPTIONS.find((o) => o.value === newCategory)?.hint}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-body mb-1.5">Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Short note shown on the card…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-body placeholder:text-brand-body/40 focus:outline-none focus:ring-2 focus:ring-brand-cta/30 resize-y min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-body mb-1.5">File</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setAddFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-brand-body/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-features file:text-brand-emerald"
            />
            <p className="text-xs text-brand-body/50 mt-1">PDF or DOCX, up to 50 MB.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => setAddModalOpen(false)}
              className="h-10 px-4 text-sm font-medium text-brand-body/80 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="h-10 px-5 text-sm font-semibold text-white bg-brand-cta hover:bg-brand-cta-hover rounded-xl shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                'Upload & index'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
