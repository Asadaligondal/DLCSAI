'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';

const DISABILITIES_OPTIONS = [
  'Autism Spectrum Disorder (P)',
  'Deaf or Hard-of-Hearing (H)',
  'Developmental Delay (T)',
  'Dual-Sensory Impairment (O)',
  'Emotional or Behavioral Disability (J)',
  'Established Conditions (Age: 0-2) (U)',
  'Gifted (L)',
  'Hospitalized or Homebound (M)',
  'Intellectual Disability (W)',
  'Language Impairment (G)',
  'Orthopedic Impairment (C)',
  'Other Health Impairment (V)',
  'Traumatic Brain Injury (S)',
  'Specific Learning Disability (K)',
  'Speech Impairment (F)',
  'Visual Impairment (I)'
];
const STRENGTHS_OPTIONS = [
  'Good Memory',
  'Creative',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Artistic',
  'Athletic',
  'Teamwork',
  'Adaptability',
  'Organization',
  'Perseverance',
  'Attention to Detail',
  'Curiosity',
  'Others'
];
const WEAKNESSES_OPTIONS = [
  'Reading Comprehension',
  'Focus',
  'Math Skills',
  'Social Skills',
  'Writing',
  'Organization',
  'Processing Speed',
  'Working Memory',
  'Fine Motor',
  'Gross Motor',
  'Anxiety',
  'Executive Functioning',
  'Behavioral Regulation',
  'Others'
];

export default function Goals() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'academic',
    targetDisabilities: [],
    targetWeaknesses: [],
    targetWeaknessesOther: '',
    requiredStrengths: [],
    requiredStrengthsOther: '',
    gradeLevel: '',
    priority: 'medium',
    isActive: true
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) {
      router.push('/login');
      return;
    }
    setUser(u);
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchGoals();
    }
  }, [token]);

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data.goals || []);
    } catch (error) {
      toast.error('Failed to fetch goals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await axios.put(`/api/goals/${editingGoal._id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Goal updated successfully');
      } else {
        await axios.post('/api/goals', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Goal created successfully');
      }

      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving goal');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/goals/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Goal deleted successfully');
      fetchGoals();
      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting goal');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingGoal(null);
    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setForm({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetDisabilities: goal.targetDisabilities || [],
      targetWeaknesses: goal.targetWeaknesses || [],
      requiredStrengths: goal.requiredStrengths || [],
      gradeLevel: goal.gradeLevel || '',
      priority: goal.priority,
      isActive: goal.isActive
    });
    setEditingGoal(goal);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'academic',
      targetDisabilities: [],
      targetWeaknesses: [],
      requiredStrengths: [],
      gradeLevel: '',
      priority: 'medium',
      isActive: true
    });
  };

  const getCategoryBadge = (category) => {
    const colors = {
      academic: 'bg-purple-100 text-purple-800',
      behavioral: 'bg-green-100 text-green-800',
      social: 'bg-pink-100 text-pink-800',
      physical: 'bg-yellow-100 text-yellow-800',
      communication: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Goals</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''}</p>
          </div>
          {user.role === 'admin' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Goal
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white appearance-none transition-all"
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="social">Social</option>
                  <option value="physical">Physical</option>
                  <option value="communication">Communication</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  {user.role === 'admin' && (
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredGoals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500 text-sm">
                      {searchQuery || filterCategory !== 'all' ? 'No goals match your filters' : 'No goals found'}
                    </td>
                  </tr>
                ) : (
                  filteredGoals.map((goal) => (
                    <tr key={goal._id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-slate-900">{goal.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{goal.description}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${getCategoryBadge(goal.category)}`}>
                          {goal.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${getPriorityBadge(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{goal.gradeLevel || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${goal.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${goal.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {goal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {user.role === 'admin' && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(goal)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm({ open: true, id: goal._id })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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
        <Modal
          title={editingGoal ? 'Edit Goal' : 'Create Goal'}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(null);
          }}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                placeholder="Goal title"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows="3"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none transition-all"
                placeholder="Describe the goal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                >
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="social">Social</option>
                  <option value="physical">Physical</option>
                  <option value="communication">Communication</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grade Level <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                placeholder="e.g., K-2, 3-5, 6-8"
              />
            </div>

            <MultiSelect
              label="Target Exceptionalities"
              options={DISABILITIES_OPTIONS}
              value={form.targetDisabilities}
              onChange={(value) => setForm({ ...form, targetDisabilities: value })}
              placeholder="Select target exceptionalities..."
            />

            <MultiSelect
              label="Target Weaknesses"
              options={WEAKNESSES_OPTIONS}
              value={form.targetWeaknesses}
              onChange={(value) => setForm({ ...form, targetWeaknesses: value })}
              placeholder="Select target weaknesses..."
            />

            {form.targetWeaknesses?.includes('Others') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Target Weaknesses (describe)</label>
                <input
                  type="text"
                  value={form.targetWeaknessesOther}
                  onChange={(e) => setForm({ ...form, targetWeaknessesOther: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe other target weaknesses..."
                />
              </div>
            )}

            <MultiSelect
              label="Required Strengths"
              options={STRENGTHS_OPTIONS}
              value={form.requiredStrengths}
              onChange={(value) => setForm({ ...form, requiredStrengths: value })}
              placeholder="Select required strengths..."
            />

            {form.requiredStrengths?.includes('Others') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Required Strengths (describe)</label>
                <input
                  type="text"
                  value={form.requiredStrengthsOther}
                  onChange={(e) => setForm({ ...form, requiredStrengthsOther: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe other required strengths..."
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingGoal(null); }}
                className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                {editingGoal ? 'Update' : 'Create'} Goal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete Goal"
          message="Are you sure you want to delete this goal? This action cannot be undone."
          type="danger"
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ open: false, id: null })}
        />
      )}
    </div>
  );
}
