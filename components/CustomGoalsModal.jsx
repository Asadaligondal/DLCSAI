"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Plus, X, Target } from 'lucide-react';

const GOAL_CATEGORIES = [
  { key: 'academic', label: 'Academic' },
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'functional', label: 'Functional' },
  { key: 'social', label: 'Social' },
  { key: 'communication', label: 'Communication' }
];

export default function CustomGoalsModal({ initial = [], onClose, onSave, inline = false }) {
  const [goals, setGoals] = useState(initial || []);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'academic' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setGoals(initial || []);
  }, [initial]);

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    
    if (editingId !== null) {
      // Edit existing goal
      const updated = goals.map((g, idx) => 
        idx === editingId ? { ...newGoal, id: g.id || Date.now() } : g
      );
      setGoals(updated);
      setEditingId(null);
    } else {
      // Add new goal
      const goalToAdd = { ...newGoal, id: Date.now() };
      setGoals([...goals, goalToAdd]);
    }
    
    setNewGoal({ title: '', description: '', category: 'academic' });
  };

  const handleEditGoal = (idx) => {
    setNewGoal({ ...goals[idx] });
    setEditingId(idx);
  };

  const handleDeleteGoal = (idx) => {
    const updated = goals.filter((_, i) => i !== idx);
    setGoals(updated);
    if (editingId === idx) {
      setEditingId(null);
      setNewGoal({ title: '', description: '', category: 'academic' });
    }
    if (editingId > idx) {
      setEditingId(editingId - 1);
    }
  };

  const handleSave = () => {
    onSave(goals);
    if (!inline) onClose();
  };

  const goalsByCategory = GOAL_CATEGORIES.map(cat => ({
    ...cat,
    goals: goals.filter(g => g.category === cat.key)
  })).filter(cat => cat.goals.length > 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Custom Goals"
      size="lg"
    >
      <div className="space-y-6">
        {/* Add/Edit Goal Form */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {editingId !== null ? 'Edit Goal' : 'Add New Goal'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Goal Title *</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g. Improve reading comprehension"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Detailed description of the goal and expected outcomes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {GOAL_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                disabled={!newGoal.title.trim()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {editingId !== null ? 'Update Goal' : 'Add Goal'}
              </button>
              
              {editingId !== null && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNewGoal({ title: '', description: '', category: 'academic' });
                  }}
                  className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Selected Goals ({goals.length})</h4>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No custom goals added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add goals above to include them in IEP generation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goalsByCategory.map(cat => (
                <div key={cat.key} className="border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {cat.label} ({cat.goals.length})
                    </h5>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {cat.goals.map((goal, idx) => (
                      <div key={goal.id} className="px-3 py-3 flex items-start justify-between hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <h6 className="text-sm font-medium text-gray-900">{goal.title}</h6>
                          {goal.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex items-center gap-1">
                          <button
                            onClick={() => handleEditGoal(goals.findIndex(g => g.id === goal.id))}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Edit goal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goals.findIndex(g => g.id === goal.id))}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete goal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Save Goals ({goals.length})
          </button>
        </div>
      </div>
    </Modal>
  );
}