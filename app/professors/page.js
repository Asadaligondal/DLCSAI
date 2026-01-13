'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function Professors() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [professors, setProfessors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolId: ''
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) {
      router.push('/login');
      return;
    }
    // Only admins can access this page
    if (u.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(u);
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchProfessors();
    }
  }, [token]);

  const fetchProfessors = async () => {
    try {
      const res = await axios.get('/api/auth/professors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessors(res.data.professors || []);
    } catch (error) {
      toast.error('Failed to fetch professors');
    }
  };

  const handleOpenModal = (prof = null) => {
    if (prof) {
      setEditingProf(prof);
      setFormData({
        name: prof.name,
        email: prof.email,
        password: '',
        schoolId: prof.schoolId || ''
      });
    } else {
      setEditingProf(null);
      setFormData({ name: '', email: '', password: '', schoolId: '' });
    }
    console.log("OPENING MODAL");
    
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
        await axios.put(`/api/auth/professors/${editingProf._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Professor updated successfully');
      } else {
        await axios.post('/api/auth/register', { ...formData, role: 'professor' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Professor added successfully');
      }
      fetchProfessors();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/auth/professors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Professor deleted successfully');
      fetchProfessors();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete professor');
    }
  };

  const filteredProfessors = professors.filter(
    (prof) =>
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-full px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Professors</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredProfessors.length} total</p>
          </div>
          {user.role === 'admin' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Professor
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search professors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-sm pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  {user.role === 'admin' && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProfessors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No professors found
                    </td>
                  </tr>
                ) : (
                  filteredProfessors.map((prof) => (
                    <tr key={prof._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {prof.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{prof.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{prof.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {prof.schoolId || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {prof.createdAt ? new Date(prof.createdAt).toLocaleDateString() : '-'}
                      </td>
                      {user.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(prof)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(prof)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
        <Modal
          title={editingProf ? 'Edit Professor' : 'Add Professor'}
          onClose={handleCloseModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingProf && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!editingProf}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School ID (Optional)
              </label>
              <input
                type="text"
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingProf ? 'Update' : 'Add'} Professor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Professor"
          message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
          type="danger"
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm._id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
