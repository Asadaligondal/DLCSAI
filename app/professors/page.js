'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';

export default function Professors() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [professors, setProfessors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', schoolId: '' });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) { router.push('/login'); return; }
    if (u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    setToken(t);
  }, [router]);

  useEffect(() => { if (token) fetchProfessors(); }, [token]);

  const fetchProfessors = async () => {
    try {
      const res = await axios.get('/api/auth/professors', { headers: { Authorization: `Bearer ${token}` } });
      setProfessors(res.data.professors || []);
    } catch { toast.error('Failed to fetch providers'); }
  };

  const handleOpenModal = (prof = null) => {
    if (prof) {
      setEditingProf(prof);
      setFormData({ name: prof.name, email: prof.email, password: '', schoolId: prof.schoolId || '' });
    } else {
      setEditingProf(null);
      setFormData({ name: '', email: '', password: '', schoolId: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProf(null);
    setFormData({ name: '', email: '', password: '', schoolId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProf) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await axios.put(`/api/auth/professors/${editingProf._id}`, updateData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Provider updated successfully');
      } else {
        await axios.post('/api/auth/register', { ...formData, role: 'professor' }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Provider added successfully');
      }
      fetchProfessors();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/auth/professors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Provider deleted');
      fetchProfessors();
      setDeleteConfirm(null);
    } catch { toast.error('Failed to delete provider'); }
  };

  const filteredProfessors = professors.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputCls = "w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher / Service Providers</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filteredProfessors.length} provider{filteredProfessors.length !== 1 ? 's' : ''}</p>
          </div>
          {user.role === 'admin' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">School ID</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  {user.role === 'admin' && (
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfessors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-300" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">No providers found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProfessors.map((prof) => (
                    <tr key={prof._id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-xs">{prof.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{prof.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{prof.email}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 font-mono tabular-nums">{prof.schoolId || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{prof.createdAt ? new Date(prof.createdAt).toLocaleDateString() : '—'}</td>
                      {user.role === 'admin' && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(prof)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(prof)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editingProf ? 'Edit Provider' : 'Add Provider'} onClose={handleCloseModal}>
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password {editingProf && <span className="text-slate-400 font-normal">(leave blank to keep)</span>}
              </label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls} required={!editingProf} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">School ID <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" value={formData.schoolId} onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })} className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={handleCloseModal} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md">
                {editingProf ? 'Update' : 'Add Provider'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Provider"
          message={`Are you sure you want to delete ${deleteConfirm.name}? This cannot be undone.`}
          type="danger"
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm._id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
