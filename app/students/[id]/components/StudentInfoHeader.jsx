"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import MultiSelect from '@/components/MultiSelect';
import { X, Save, Target, ChevronDown, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import AccommodationsModal from '@/components/AccommodationsModal';
import CustomGoalsModal from '@/components/CustomGoalsModal';
import Modal from '@/components/Modal';
import MeetingPurposeCollapsible from '@/components/MeetingPurposeCollapsible';
import StudentWorkspaceNav from './StudentWorkspaceNav';
import { DOMAIN_AREA_OPTIONS } from '@/lib/domainAreas';

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
  onAssessmentContextSave,
  customGoals = []
}) {
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [accommodationsInitial, setAccommodationsInitial] = useState(null);
  const [showCustomGoals, setShowCustomGoals] = useState(false);
  const [showAccomDetails, setShowAccomDetails] = useState(false);
  const [showCustomGoalDetails, setShowCustomGoalDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState('');
  const [assessmentUploading, setAssessmentUploading] = useState(false);

  const fmtViewDate = (v) => {
    if (!v) return '—';
    const raw = String(v);
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[2]}/${m[3]}/${m[1]}`;
    const dt = new Date(v);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

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

  const openAssessmentModal = () => {
    setAssessmentDraft(formData.assessmentContext || '');
    setShowAssessmentModal(true);
  };

  const handleAssessmentFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PDF or image file');
      return;
    }
    setAssessmentUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mode', 'assessment');
      const r = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      const extracted = data.data?.assessmentContext || '';
      setAssessmentDraft(extracted);
      toast.success('Extracted into text — review and save');
    } catch (e) {
      toast.error(e.message || 'Failed to extract');
    } finally {
      setAssessmentUploading(false);
    }
  };

  const handleAssessmentSave = async () => {
    if (!onAssessmentContextSave) return;
    try {
      await onAssessmentContextSave(assessmentDraft.trim());
      setShowAssessmentModal(false);
    } catch {
      toast.error('Could not save');
    }
  };

  const pillText = (raw) => {
    const s = raw != null ? String(raw).trim() : '';
    if (!s || s === '—') return null;
    return s;
  };

  return (
    <div className="mb-6">
      <div>
        {!isEditing ? (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
            {/* Whole row toggles expand; workspace nav stops propagation (no nested buttons). */}
            <div
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((e) => !e)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer text-left select-none"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 shrink-0">Student Context</h3>
                {student?._id ? (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <StudentWorkspaceNav studentId={String(student._id)} studentName={formData.name || student?.name} />
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
                <span className="text-xs text-slate-500 truncate hidden md:inline max-w-[200px] lg:max-w-[320px]">
                  {[
                    formData.studentId || student?.studentId,
                    formData.gradeLevel || student?.gradeLevel,
                    (() => {
                      const acc = student?.student_accommodations || {};
                      const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
                      const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
                      return total > 0 ? `${total} accommodations` : null;
                    })(),
                    customGoals.length > 0 ? `${customGoals.length} custom goals` : '0 custom goals',
                  ].filter(Boolean).join(' · ')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Animated expandable content */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
            <div className="overflow-hidden">
            <div className={`px-5 pb-5 pt-0 border-t border-slate-100 transition-opacity duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="space-y-4 pt-4">
              <p className="text-xs text-slate-500">
                Demographics and contact details are on{' '}
                {student?._id ? (
                  <Link
                    href={`/students/${student._id}/profile`}
                    className="text-primary-600 font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Student profile
                  </Link>
                ) : (
                  <span className="text-slate-600">Student profile</span>
                )}
                .
              </p>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">IEP key dates</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                  {[
                    ['originalMeetingPlanDate', 'Original meeting / plan date'],
                    ['initiationDate', 'Initiation date'],
                    ['durationDate', 'Duration date'],
                    ['reviewDueDate', 'Review due date'],
                    ['reevaluationDueDate', 'Reevaluation due date'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <div className="text-xs font-medium text-slate-500 mb-1.5">{label}</div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const v = fmtViewDate(formData[key] || (student?.[key] ? new Date(student[key]).toISOString().split('T')[0] : ''));
                          return v === '—' ? (
                            <span className="text-sm text-slate-500">None</span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{v}</span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Amendment and meeting</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Amendment date</div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const v = fmtViewDate(formData.amendmentDate || (student?.amendmentDate ? new Date(student.amendmentDate).toISOString().split('T')[0] : ''));
                        return v === '—' ? (
                          <span className="text-sm text-slate-500">None</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{v}</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Previously amended</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.previouslyAmended || student?.previouslyAmended) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">
                          {formData.previouslyAmended || student?.previouslyAmended}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Meeting purpose</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.meetingPurpose || student?.meetingPurpose) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 whitespace-pre-wrap break-words max-w-full">
                          {formData.meetingPurpose || student?.meetingPurpose}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Program</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Domain(s) / transition service activity area(s)</div>
                    {pillText(formData.domainsTransitionAreas || student?.domainsTransitionAreas) ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {formData.domainsTransitionAreas || student?.domainsTransitionAreas}
                      </p>
                    ) : (
                      <span className="text-sm text-slate-500">None</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Associated plan</div>
                    {pillText(formData.associatedPlans || student?.associatedPlans) ? (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">
                        {formData.associatedPlans || student?.associatedPlans}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">None</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Domain area(s)</div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const areas = Array.isArray(formData.domainAreas) && formData.domainAreas.length
                          ? formData.domainAreas
                          : (Array.isArray(student?.domainAreas) ? student.domainAreas : []);
                        return areas.length > 0 ? (
                          areas.map((d, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-50 text-violet-800 border border-violet-100">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Primary exceptionality</div>
                <div className="flex flex-wrap gap-2">
                  {pillText(formData.primaryExceptionality || student?.primaryExceptionality) ? (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">
                      {formData.primaryExceptionality || student?.primaryExceptionality}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">None</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Exceptionalities</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const list = Array.isArray(formData.disabilities) && formData.disabilities.length
                      ? formData.disabilities
                      : (Array.isArray(student?.disabilities) ? student.disabilities : []);
                    return list.length > 0 ? (
                      <>
                        {list.slice(0, 8).map((d, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                            {d}
                          </span>
                        ))}
                        {list.length > 8 && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600">
                            +{list.length - 8} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">None</span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
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
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Additional student context</div>
              {(formData.studentNotes || student?.studentNotes || '').trim() ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {formData.studentNotes || student?.studentNotes}
                </p>
              ) : (
                <span className="text-sm text-slate-500">None</span>
              )}
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

            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-600">Assessment context</div>
                  <div className="text-sm text-slate-500 mt-0.5 truncate">
                    {(formData.assessmentContext || '').trim()
                      ? `${String(formData.assessmentContext).trim().length} chars (PLAAFP & academic performance only)`
                      : 'None — optional; type or upload PDF/image'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAssessmentModal}
                  className="shrink-0 px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
            </div>
            </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Edit student context</h2>
                <div className="flex items-center gap-2">
                  {student?._id ? (
                    <StudentWorkspaceNav studentId={String(student._id)} studentName={formData.name || student?.name} />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Close edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Demographics and contact details are edited on{' '}
                {student?._id ? (
                  <Link href={`/students/${student._id}/profile`} className="text-primary-600 font-medium hover:underline">
                    Student profile
                  </Link>
                ) : (
                  <span className="text-slate-600">Student profile</span>
                )}
                .
              </p>

              <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">IEP key dates</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    ['originalMeetingPlanDate', 'Original meeting / plan date'],
                    ['initiationDate', 'Initiation date'],
                    ['durationDate', 'Duration date'],
                    ['reviewDueDate', 'Review due date'],
                    ['reevaluationDueDate', 'Reevaluation due date'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-700 mb-2">{label}</label>
                      <input
                        type="date"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Amendment and meeting</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Amendment date</label>
                    <input
                      type="date"
                      value={formData.amendmentDate || ''}
                      onChange={(e) => setFormData({ ...formData, amendmentDate: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Previously amended</label>
                    <select
                      value={formData.previouslyAmended || ''}
                      onChange={(e) => setFormData({ ...formData, previouslyAmended: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    >
                      <option value="">—</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Meeting purpose</label>
                    <MeetingPurposeCollapsible
                      idPrefix="sih-mp-edit"
                      tags={formData.meetingPurposeTags || []}
                      otherText={formData.meetingPurposeOther || ''}
                      onChange={(patch) => setFormData({ ...formData, ...patch })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Program</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Domain(s) / transition service activity area(s)</label>
                    <textarea
                      value={formData.domainsTransitionAreas || ''}
                      onChange={(e) => setFormData({ ...formData, domainsTransitionAreas: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 resize-y"
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Associated plan</label>
                    <input
                      type="text"
                      value={formData.associatedPlans || ''}
                      onChange={(e) => setFormData({ ...formData, associatedPlans: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      placeholder="e.g. IEP, 504"
                    />
                  </div>
                  <div>
                    <MultiSelect
                      label="Domain area"
                      options={DOMAIN_AREA_OPTIONS}
                      value={Array.isArray(formData.domainAreas) ? formData.domainAreas : []}
                      onChange={(value) => setFormData({ ...formData, domainAreas: value })}
                      placeholder="Select domain area(s)…"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-medium text-slate-700 mb-2">Primary exceptionality</label>
                <select
                  value={formData.primaryExceptionality || ''}
                  onChange={(e) => setFormData({ ...formData, primaryExceptionality: e.target.value })}
                  className="w-full max-w-xl h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                >
                  <option value="">Select primary exceptionality…</option>
                  {(disabilitiesOptions || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <MultiSelect
                label="Exceptionalities"
                options={disabilitiesOptions}
                value={Array.isArray(formData.disabilities) ? formData.disabilities : []}
                onChange={(value) => setFormData({ ...formData, disabilities: value })}
                placeholder="Select exceptionalities…"
              />

              <div className="border-t border-slate-100 pt-4 space-y-4">
              <MultiSelect
                label="Strengths"
                options={strengthsOptions}
                value={formData.strengths}
                onChange={(value) => setFormData({ ...formData, strengths: value })}
                placeholder="Select strengths..."
              />

              {(Array.isArray(formData.strengths) ? formData.strengths : []).includes('Others') && (
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

              {(Array.isArray(formData.weaknesses) ? formData.weaknesses : []).includes('Others') && (
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
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional student context (optional)</label>
                <textarea
                  value={formData.studentNotes || ''}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 500);
                    setFormData({ ...formData, studentNotes: val });
                  }}
                  placeholder="e.g., learning style, interests, triggers, what supports work best…"
                  maxLength={500}
                  className="w-full min-h-[96px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Optional notes to help tailor the IEP.</span>
                  <span>{formData.studentNotes ? formData.studentNotes.length : 0}/500</span>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save context
              </button>
            </div>
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

      {showAssessmentModal && (
        <Modal
          title="Assessment context"
          onClose={() => { if (!assessmentUploading) setShowAssessmentModal(false); }}
          size="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              Optional. Used only when generating <span className="font-medium text-slate-800">PLAAFP</span> and{' '}
              <span className="font-medium text-slate-800">academic performance</span>. Type below or upload a PDF/image to extract.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                id="assessment-pdf-upload"
                accept="application/pdf"
                className="hidden"
                disabled={assessmentUploading}
                onChange={handleAssessmentFile}
              />
              <input
                type="file"
                id="assessment-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                className="hidden"
                disabled={assessmentUploading}
                onChange={handleAssessmentFile}
              />
              <button
                type="button"
                disabled={assessmentUploading}
                onClick={() => document.getElementById('assessment-pdf-upload')?.click()}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                type="button"
                disabled={assessmentUploading}
                onClick={() => document.getElementById('assessment-image-upload')?.click()}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                Image
              </button>
              {assessmentUploading && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Upload className="w-4 h-4 animate-pulse" />
                  Extracting…
                </span>
              )}
            </div>
            <textarea
              value={assessmentDraft}
              onChange={(e) => setAssessmentDraft(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y min-h-[160px]"
              placeholder="Assessment notes, scores, observations…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={assessmentUploading}
                onClick={() => setShowAssessmentModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assessmentUploading || !onAssessmentContextSave}
                onClick={handleAssessmentSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

}