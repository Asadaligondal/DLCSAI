import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import MultiSelect from '@/components/MultiSelect';
import { toast } from 'react-toastify';

export default function CustomizeGoalModal({ isOpen = true, onClose, student, onSaved }) {
  const [form, setForm] = useState({
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
  const [saving, setSaving] = useState(false);
  const [assignedGoals, setAssignedGoals] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // Fetch details for assigned goals
    const fetchGoals = async () => {
      if (!student?.assignedGoals || student.assignedGoals.length === 0) return;
      try {
        const token = localStorage.getItem('token');
        const details = await Promise.all(student.assignedGoals.map(async (gId) => {
          const res = await fetch(`/api/goals/${gId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return null;
          const data = await res.json();
          return data.goal;
        }));
        setAssignedGoals(details.filter(Boolean));
      } catch (err) {
        console.error('Failed to fetch assigned goals', err);
      }
    };

    fetchGoals();
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        // Update existing goal
        const res = await fetch(`/api/goals/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update');
        // update local list
        setAssignedGoals((prev) => prev.map((g) => (g._id === editingId ? data.goal : g)));
        toast.success('Goal updated');
        setEditingId(null);
        setForm({ title: '', description: '', category: 'academic', targetDisabilities: [], targetWeaknesses: [], requiredStrengths: [], gradeLevel: '', priority: 'medium', isActive: true });
        onSaved && onSaved(data.goal);
      } else {
        const res = await fetch(`/api/students/${student._id}/add-custom-goal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save');
        toast.success('Custom goal added');
        setAssignedGoals((prev) => [data.goal, ...prev]);
        onSaved && onSaved(data.goal);
        setForm({ title: '', description: '', category: 'academic', targetDisabilities: [], targetWeaknesses: [], requiredStrengths: [], gradeLevel: '', priority: 'medium', isActive: true });
      }
    } catch (err) {
      console.error('Save custom goal error', err);
      toast.error(err.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingId(goal._id);
    setForm({
      title: goal.title || '',
      description: goal.description || '',
      category: goal.category || 'academic',
      targetDisabilities: goal.targetDisabilities || [],
      targetWeaknesses: goal.targetWeaknesses || [],
      requiredStrengths: goal.requiredStrengths || [],
      gradeLevel: goal.gradeLevel || '',
      priority: goal.priority || 'medium',
      isActive: goal.isActive !== undefined ? goal.isActive : true
    });
  };

  const handleDelete = async (goalId) => {
    if (!confirm('Delete this custom goal?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setAssignedGoals((prev) => prev.filter((g) => g._id !== goalId));
      toast.success('Goal deleted');
      // parent can refresh
      onSaved && onSaved(null);
    } catch (err) {
      console.error('Delete goal error', err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title={`Create Custom Goal for ${student?.name || 'Student'}`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        {assignedGoals.length > 0 && (
          <div className="space-y-3 mb-2">
            <h4 className="text-sm font-semibold">Existing Custom Goals</h4>
            <div className="space-y-2 max-h-40 overflow-auto">
              {assignedGoals.map((g) => (
                <div key={g._id} className="p-3 border rounded-lg flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{g.title}</div>
                    <div className="text-xs text-gray-500">{g.category} • {g.priority}</div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{g.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <button type="button" onClick={() => handleEdit(g)} className="text-indigo-600 text-sm">Edit</button>
                    <button type="button" onClick={() => handleDelete(g._id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <input type="text" value={student?.name || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="academic">Academic</option>
              <option value="behavioral">Behavioral</option>
              <option value="social">Social</option>
              <option value="physical">Physical</option>
              <option value="communication">Communication</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white">{saving ? 'Saving...' : 'Create Goal'}</button>
        </div>
      </form>
    </Modal>
  );
}
