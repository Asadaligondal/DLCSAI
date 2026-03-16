'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FileText, Trash2, FileUp } from 'lucide-react';

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
            <section>
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
                            {doc.status}
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
