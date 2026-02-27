"use client";

import React, { useState } from 'react';
import MultiSelect from '@/components/MultiSelect';
import { X, Save, Target, ChevronDown } from 'lucide-react';
import AccommodationsModal from '@/components/AccommodationsModal';
import CustomGoalsModal from '@/components/CustomGoalsModal';
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
  weaknessesOptions,
  onCustomizeGoals,
  onCustomGoalsSaved,
  onAccommodationsSaved,
  customGoals = []
}) {
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [accommodationsInitial, setAccommodationsInitial] = useState(null);
  const [showCustomGoals, setShowCustomGoals] = useState(false);
  const [showAccomDetails, setShowAccomDetails] = useState(false);
  const [showCustomGoalDetails, setShowCustomGoalDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleCustomGoalsSave = (goals) => {
    setShowCustomGoals(false);
    if (onCustomGoalsSaved) onCustomGoalsSaved(goals);
  };
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        {!isEditing ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Collapsible header - always visible */}
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <h3 className="text-base font-semibold text-slate-900">Student Context</h3>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-slate-600 truncate">
                  {[
                    formData.name || student?.name || '—',
                    formData.gradeLevel || student?.gradeLevel || '—',
                    Array.isArray(student?.disabilities) && student.disabilities[0] ? student.disabilities[0] : null,
                    (() => {
                      const acc = student?.student_accommodations || {};
                      const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
                      const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
                      return total > 0 ? `${total} accommodations` : null;
                    })(),
                    customGoals.length > 0 ? `${customGoals.length} custom goals` : '0 custom goals'
                  ].filter(Boolean).join(' • ')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expandable content */}
            {isExpanded && (
            <div className="px-5 pb-5 pt-0 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex items-center text-slate-800">{formData.name || student?.name || '—'}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Student ID</label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex items-center text-slate-800">{formData.studentId || student?.studentId || '—'}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex items-center text-slate-800">{formData.age || student?.age || '—'}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Grade</label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex items-center text-slate-800">{formData.gradeLevel || student?.gradeLevel || '—'}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Exceptionalities</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.disabilities) && student.disabilities.length > 0 ? (
                    <>
                      {student.disabilities.slice(0,6).map((d, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{d}</span>
                      ))}
                      {student.disabilities.length > 6 && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600">+{student.disabilities.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Target className="w-4 h-4 text-slate-300" />None</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.strengths) && student.strengths.length > 0 ? (
                    <>
                      {student.strengths.slice(0,6).map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">{s}</span>
                      ))}
                      {student.strengths.length > 6 && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600">+{student.strengths.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">None</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Weaknesses</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(student?.weaknesses) && student.weaknesses.length > 0 ? (
                    <>
                      {student.weaknesses.slice(0,6).map((w, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 border border-amber-100">{w}</span>
                      ))}
                      {student.weaknesses.length > 6 && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600">+{student.weaknesses.length - 6} more</span>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">None</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Accommodations</div>
                  <div className="text-sm text-slate-500 mt-0.5">{(() => {
                    const acc = student.student_accommodations || {};
                    const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
                    const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
                    return total > 0 ? `${total} selected` : 'None';
                  })()}</div>
                </div>
                <button onClick={openAccommodations} className="px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Edit accommodations</button>
              </div>
              {student.student_accommodations && (() => {
                const acc = student.student_accommodations;
                const hasAny = (acc.classroom && Object.values(acc.classroom).flat().length) || (acc.assessment && Object.values(acc.assessment).flat().length);
                if (!hasAny) return null;
                return (
                  <>
                    <div className="mt-2 text-xs text-blue-600 cursor-pointer" onClick={() => setShowAccomDetails(s => !s)}>
                      {showAccomDetails ? 'Hide details' : 'Show details'}
                    </div>
                    {showAccomDetails && (
                      <div className="mt-2 max-h-28 overflow-auto text-xs text-gray-700 space-y-2">
                        {acc.classroom && (
                          <div>
                            <div className="text-xs font-medium text-gray-600">Classroom</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.values(acc.classroom).flat().map((it, idx) => (
                                <span key={`c-${idx}`} className="px-3 py-1.5 text-xs rounded-xl bg-gray-100">{it.label || it}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {acc.assessment && (
                          <div>
                            <div className="text-xs font-medium text-gray-600">Assessment / District</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.values(acc.assessment).flat().map((it, idx) => (
                                <span key={`a-${idx}`} className="px-3 py-1.5 text-xs rounded-xl bg-gray-100">{it.label || it}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Custom Goals</div>
                  <div className="text-sm text-slate-500 mt-0.5">{customGoals.length > 0 ? `${customGoals.length} selected` : 'None'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={onCustomizeGoals} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Target className="w-4 h-4" />
                    Add goal
                  </button>
                  <button onClick={() => setShowCustomGoals(true)} className="px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Edit selection</button>
                </div>
              </div>
              {customGoals.length > 0 && (
                <>
                  <div className="mt-2 text-xs text-blue-600 cursor-pointer" onClick={() => setShowCustomGoalDetails(s => !s)}>
                    {showCustomGoalDetails ? 'Hide details' : 'Show details'}
                  </div>
                  {showCustomGoalDetails && (
                    <div className="mt-2 max-h-28 overflow-auto text-xs text-gray-700 space-y-2">
                      {customGoals.map((g, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="font-medium text-slate-800">{g.title || g}</div>
                          {g.description && <div className="mt-0.5 text-slate-600">{g.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Student Context (Optional)</label>
                <textarea
                  value={formData.studentNotes || ''}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 500);
                    setFormData({ ...formData, studentNotes: val });
                  }}
                  placeholder="e.g., learning style, interests, triggers, what supports work best…"
                  maxLength={500}
                  className="w-full min-h-[96px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <div>Optional notes to help tailor the IEP.</div>
                  <div>{formData.studentNotes ? formData.studentNotes.length : 0}/500</div>
                </div>
              </div>

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
        <Modal title="Student Accommodations" onClose={() => setShowAccommodations(false)} size="wizard">
          <AccommodationsModal
            inline
            initial={accommodationsInitial}
            onClose={() => setShowAccommodations(false)}
            onSave={(data) => { handleSaveAccommodations(data); setShowAccommodations(false); if (onAccommodationsSaved) onAccommodationsSaved(); }}
          />
        </Modal>
      )}

      {showCustomGoals && (
        <CustomGoalsModal
          initial={customGoals.map(g => ({ ...g, id: g._id || g.id || g.title }))}
          onClose={() => setShowCustomGoals(false)}
          onSave={handleCustomGoalsSave}
        />
      )}
    </div>
  );

}