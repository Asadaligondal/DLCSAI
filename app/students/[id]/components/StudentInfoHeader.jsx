"use client";

import React, { useState } from 'react';
import MultiSelect from '@/components/MultiSelect';
import { X, Save } from 'lucide-react';
import AccommodationsModal from '@/components/AccommodationsModal';
import Modal from '@/components/Modal';

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
  , onAccommodationsSaved
}) {
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [accommodationsInitial, setAccommodationsInitial] = useState(null);
  const [showAccomDetails, setShowAccomDetails] = useState(false);

  const openAccommodations = async () => {
    // try to fetch existing accommodations for this student
    if (student && student._id) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/students/${student._id}/accommodations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAccommodationsInitial(data.accommodations || null);
        } else {
          setAccommodationsInitial(null);
        }
      } catch (err) {
        setAccommodationsInitial(null);
      }
    } else {
      setAccommodationsInitial(null);
    }

    setShowAccommodations(true);
  };

  const handleSaveAccommodations = async (payload) => {
    // Save for existing student via API if available, otherwise just close and bubble up
    if (student && student._id) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/students/${student._id}/accommodations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        // ignore errors here; parent can refetch if needed
      }
    }

    if (onAccommodationsSaved) onAccommodationsSaved();
  };
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        {!isEditing ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Student Context</h3>
              <div className="text-xs text-gray-500">Summary</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 h-8 text-sm border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full px-2 h-8 text-sm border border-gray-200 rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="w-full px-2 h-8 text-sm border border-gray-200 rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Grade</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    required
                    className="w-full px-2 h-8 text-sm border border-gray-200 rounded focus:outline-none"
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
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Disabilities</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.disabilities) && student.disabilities.length > 0 ? (
                    <>
                      {student.disabilities.slice(0,6).map((d, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{d}</span>
                      ))}
                      {student.disabilities.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">+{student.disabilities.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">None</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.strengths) && student.strengths.length > 0 ? (
                    <>
                      {student.strengths.slice(0,6).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{s}</span>
                      ))}
                      {student.strengths.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">+{student.strengths.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">None</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Weaknesses</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.weaknesses) && student.weaknesses.length > 0 ? (
                    <>
                      {student.weaknesses.slice(0,6).map((w, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{w}</span>
                      ))}
                      {student.weaknesses.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">+{student.weaknesses.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">None</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-700">Accommodations</div>
                <div className="text-sm text-gray-500">{(() => {
                  const acc = student.student_accommodations || {};
                  const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
                  const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
                  return total > 0 ? `${total} selected` : 'None';
                })()}</div>
              </div>

              <div>
                <button onClick={openAccommodations} className="px-3 py-1 text-sm bg-gray-100 rounded-md">Edit accommodations</button>
              </div>
            </div>

            {student.student_accommodations && (
              <>
                <div className="mt-2 text-xs text-blue-600 cursor-pointer" onClick={() => setShowAccomDetails(s => !s)}>
                  {showAccomDetails ? 'Hide details' : 'Show details'}
                </div>

                {showAccomDetails && (
                  <div className="mt-2 max-h-28 overflow-auto text-xs text-gray-700 space-y-2">
                    {student.student_accommodations.classroom && (
                      <div>
                        <div className="text-xs font-medium text-gray-600">Classroom</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.values(student.student_accommodations.classroom).flat().map((it, idx) => (
                            <span key={`c-${idx}`} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{it.label || it}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.student_accommodations.assessment && (
                      <div>
                        <div className="text-xs font-medium text-gray-600">Assessment / District</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.values(student.student_accommodations.assessment).flat().map((it, idx) => (
                            <span key={`a-${idx}`} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{it.label || it}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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
      {showAccommodations && (
        <Modal title="Student Accommodations" onClose={() => setShowAccommodations(false)} size="lg">
          <AccommodationsModal
            inline
            initial={accommodationsInitial}
            onSave={(data) => { handleSaveAccommodations(data); setShowAccommodations(false); if (onAccommodationsSaved) onAccommodationsSaved(); }}
          />
        </Modal>
      )}
    </div>
  );

}