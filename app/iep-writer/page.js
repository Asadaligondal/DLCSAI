'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Upload,
  FileSearch,
  FileText,
  User,
  Search,
  Layers,
  Zap,
  ChevronRight,
  FileCode,
  Trash2,
  FileUp
} from 'lucide-react';

const STEPS = [
  { id: 'upload', title: 'Upload Document', desc: 'PDF or Word document with student records', icon: Upload, color: 'primary' },
  { id: 'rag', title: 'RAG Pipeline', desc: 'Chunk, Embed, Index', icon: FileSearch, color: 'violet', subSteps: ['Parse & Chunk', 'Generate Embeddings', 'Store in Vector DB'] },
  { id: 'output', title: 'Document Output', desc: 'Extracted chunks & metadata', icon: FileText, color: 'blue' },
  { id: 'student', title: 'Student Form Context', desc: 'Name, grade, disabilities, strengths, weaknesses', icon: User, color: 'emerald' },
  { id: 'embed', title: 'Vector Embedding', desc: 'Student context to embedding vectors', icon: Layers, color: 'amber' },
  { id: 'similarity', title: 'Similarity Search', desc: 'Retrieve relevant chunks', icon: Search, color: 'rose' },
  { id: 'context', title: 'Final Context', desc: 'Combined document + student context', icon: FileCode, color: 'cyan' },
  { id: 'llm', title: 'LLM API Call', desc: 'Generate IEP', icon: Zap, color: 'green' }
];

const colorMap = {
  primary: 'border-primary-200 bg-primary-50/60',
  violet: 'border-violet-200 bg-violet-50/60',
  blue: 'border-blue-200 bg-blue-50/60',
  emerald: 'border-emerald-200 bg-emerald-50/60',
  amber: 'border-amber-200 bg-amber-50/60',
  rose: 'border-rose-200 bg-rose-50/60',
  cyan: 'border-cyan-200 bg-cyan-50/60',
  green: 'border-green-200 bg-green-50/60'
};

export default function IEPWriterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState({ name: 'Guest' });
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
      fetchDocuments();
    } catch {}
  }, []);

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setUploadError('Only PDF files are supported'); return; }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/documents/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.message || 'Upload failed'); return; }
      await fetchDocuments();
    } catch { setUploadError('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) await fetchDocuments();
    } catch {}
    finally { setDeletingId(null); }
  };

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <FileText className="w-[18px] h-[18px] text-violet-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">IEP Writer</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  WIP
                </span>
              </div>
              <p className="text-xs text-slate-500">RAG-powered IEP generation pipeline</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl">
            {/* Pipeline visualization */}
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />

              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative flex items-start gap-3">
                      <div className="absolute -left-[21px] w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10">
                        <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
                      </div>

                      <div className={`flex-1 flex items-start gap-3 p-3.5 rounded-xl border ${colorMap[step.color]} ml-1`}>
                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/60 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                          {step.subSteps && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {step.subSteps.map((s, j) => (
                                <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/80 border border-slate-200/60 text-slate-600">
                                  <ChevronRight className="w-2.5 h-2.5" />
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents section */}
            <section className="mt-10 pt-8 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Institutional Documents</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload PDFs to improve IEP generation with RAG context</p>
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    <FileUp className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                </div>
              </div>

              {uploadError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{uploadError}</p>
              )}

              {documents.length > 0 ? (
                <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden divide-y divide-slate-50">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.originalFilename}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.chunkCount ?? 0} chunks · {doc.status}
                            {doc.pageCount ? ` · ${doc.pageCount} pages` : ''}
                            {doc.status === 'failed' && doc.errorMessage ? ` — ${doc.errorMessage}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-card border border-slate-200/60 p-10 text-center">
                  <FileUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No documents uploaded yet</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
