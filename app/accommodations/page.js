'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { Plus, Brain, CheckCircle, Accessibility, Trash2 } from 'lucide-react';

export default function AccommodationsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ category: '', description: '' });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/accommodations');
      if (res.data && res.data.success) setList(res.data.accommodations || []);
    } catch (err) {
      console.error('Fetch accommodations error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/accommodations', formData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        setList((s) => [res.data.accommodation, ...s]);
        setFormData({ category: '', description: '' });
      }
    } catch (err) {
      console.error('Add accommodation error', err);
    }
  };

  const grouped = list.reduce((acc, item) => {
    const k = item.category || 'General';
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});

  const handleRemove = async (id) => {
    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/accommodations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        setList((s) => s.filter((it) => it._id !== id));
      }
    } catch (err) {
      console.error('Remove accommodation error', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">Accommodations Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the master list of supports used for AI generation.</p>

          <form onSubmit={handleAdd} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Category / Need</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., ADHD"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Accommodation Text</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Extended time on tests"
                required
              />
            </div>
            <div className="md:col-span-3">
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Add to Bank</button>
            </div>
          </form>

          <div className="mt-8 grid grid-cols-1 gap-4">
            {Object.keys(grouped).length === 0 && !loading && (
              <p className="text-sm text-gray-500">No accommodations yet.</p>
            )}

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{category}</h3>
                  <span className="text-sm text-gray-500">{items.length}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {items.map((it) => {
                    const isDeleting = deletingId === it._id;
                    return (
                      <li
                        key={it._id}
                        className={`flex items-start justify-between p-3 bg-white dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700 ${
                          isDeleting ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="text-sm text-gray-800 dark:text-gray-200">{it.description}</div>
                        <button
                          type="button"
                          onClick={() => handleRemove(it._id)}
                          className={`ml-4 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ${isDeleting ? 'cursor-not-allowed' : ''}`}
                          title="Remove accommodation"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <svg className="w-4 h-4 animate-spin text-red-600" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
  );
}
