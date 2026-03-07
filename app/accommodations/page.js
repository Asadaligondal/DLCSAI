'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';

export default function AccommodationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ category: '', description: '' });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) { router.push('/login'); return; }
    setUser(u);
  }, [router]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/accommodations');
      if (res.data?.success) setList(res.data.accommodations || []);
    } catch (err) {
      console.error('Fetch accommodations error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/accommodations', formData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setList((s) => [res.data.accommodation, ...s]);
        setFormData({ category: '', description: '' });
      }
    } catch (err) {
      console.error('Add accommodation error', err);
    }
  };

  const handleRemove = async (id) => {
    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/accommodations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) setList((s) => s.filter((it) => it._id !== id));
    } catch (err) {
      console.error('Remove accommodation error', err);
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = list.reduce((acc, item) => {
    const k = item.category || 'General';
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px] text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Accommodations Bank</h2>
              <p className="text-xs text-slate-500">Manage the master list of supports for AI generation</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Add form */}
            <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-card border border-slate-200/60 p-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category / Need</label>
                  <input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    placeholder="e.g., ADHD"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Accommodation Text</label>
                  <input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    placeholder="e.g., Extended time on tests"
                    required
                  />
                </div>
                <button className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </form>

            {/* Grouped list */}
            <div className="mt-6 space-y-4">
              {Object.keys(grouped).length === 0 && !loading && (
                <div className="text-center py-16 text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No accommodations yet</p>
                  <p className="text-xs">Add your first accommodation above</p>
                </div>
              )}

              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {items.map((it) => {
                      const isDeleting = deletingId === it._id;
                      return (
                        <li key={it._id} className={`flex items-start justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors group ${isDeleting ? 'opacity-50' : ''}`}>
                          <span className="text-sm text-slate-700 leading-relaxed">{it.description}</span>
                          <button
                            type="button"
                            onClick={() => handleRemove(it._id)}
                            className="ml-4 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
