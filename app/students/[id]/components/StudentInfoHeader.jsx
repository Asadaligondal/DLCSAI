import React from 'react';
import MultiSelect from '@/components/MultiSelect';
import { Target, Wand2, X, Save } from 'lucide-react';

export default function StudentInfoHeader({
  student,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  handleUpdate,
  isGenerating,
  handleGenerateIEP,
  hasExistingPlan,
  disabilitiesOptions,
  strengthsOptions,
  weaknessesOptions
  , onCustomizeGoals,
  onRegenerateCustomGoals
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                  <span className="ml-2 text-xs text-gray-400 font-normal">— write only initials (e.g. Adam Smith → A S)</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade...</option>
                  <option>Kindergarten (K)</option>
                  <option>Grade 1</option>
                  <option>Grade 2</option>
                  <option>Grade 3</option>
                  <option>Grade 4</option>
                  <option>Grade 5</option>
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9 (Freshman)</option>
                  <option>Grade 10 (Sophomore)</option>
                  <option>Grade 11 (Junior)</option>
                  <option>Grade 12 (Senior)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">Disabilities</span>
              <p className="text-sm text-gray-600 mt-1">{student.disabilities?.join(', ') || 'None'}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">Strengths</span>
              <p className="text-sm text-gray-600 mt-1">{student.strengths?.join(', ') || 'None'}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">Weaknesses</span>
              <p className="text-sm text-gray-600 mt-1">{student.weaknesses?.join(', ') || 'None'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <input
                    type="text"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <MultiSelect
                label="Exceptionalities"
                options={disabilitiesOptions}
                value={formData.disabilities}
                onChange={(value) => setFormData({ ...formData, disabilities: value })}
                placeholder="Select exceptionalities..."
              />

              <MultiSelect
                label="Strengths"
                options={strengthsOptions}
                value={formData.strengths}
                onChange={(value) => setFormData({ ...formData, strengths: value })}
                placeholder="Select strengths..."
              />

              {formData.strengths.includes('Others') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Strengths (describe)</label>
                  <input
                    type="text"
                    value={formData.strengthsOther}
                    onChange={(e) => setFormData({ ...formData, strengthsOther: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe other strengths..."
                  />
                </div>
              )}

              <MultiSelect
                label="Weaknesses"
                options={weaknessesOptions}
                value={formData.weaknesses}
                onChange={(value) => setFormData({ ...formData, weaknesses: value })}
                placeholder="Select weaknesses..."
              />

              {formData.weaknesses.includes('Others') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Weaknesses (describe)</label>
                  <input
                    type="text"
                    value={formData.weaknessesOther}
                    onChange={(e) => setFormData({ ...formData, weaknessesOther: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe other weaknesses..."
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => (onCustomizeGoals ? onCustomizeGoals() : null)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  student?.assignedGoals && student.assignedGoals.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                {student?.assignedGoals && student.assignedGoals.length > 0 ? 'View Custom Goals' : 'Customize Goals'}
              </button>

              <button
                type="button"
                onClick={() => onRegenerateCustomGoals && onRegenerateCustomGoals()}
                disabled={!(student?.assignedGoals && student.assignedGoals.length > 0)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${!(student?.assignedGoals && student.assignedGoals.length > 0) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Regenerate IEP with Custom Goals
              </button>
            </div>
          </div>

          {student.assignedGoals && student.assignedGoals.length > 0 ? (
            <div className="space-y-2 mb-4">
              {student.assignedGoals.map((goal) => (
                <div key={goal._id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    {goal.category}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm text-center">No goals assigned yet</p>
              </div>
            </div>
          )}

          {!hasExistingPlan && (
            <button
              onClick={handleGenerateIEP}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate IEP Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

}