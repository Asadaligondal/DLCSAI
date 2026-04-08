"use client";

import React, { useState } from 'react';
import MultiSelect from '@/components/MultiSelect';
import { X, Save, Target, ChevronDown } from 'lucide-react';
import AccommodationsModal from '@/components/AccommodationsModal';
import CustomGoalsModal from '@/components/CustomGoalsModal';
import Modal from '@/components/Modal';
import { DOMAIN_AREA_OPTIONS } from '@/lib/domainAreas';
import MeetingPurposeCollapsible from '@/components/MeetingPurposeCollapsible';

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

  const calcAgeFromDob = (dob) => {
    if (!dob) return { years: '', months: '', numeric: '' };
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (now.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    return { years, months, numeric: years };
  };

  const fmtViewDate = (v) => {
    if (!v) return '—';
    const raw = String(v);
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[2]}/${m[3]}/${m[1]}`;
    const dt = new Date(v);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const dobForDisplay =
    formData.dateOfBirth ||
    (student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '');
  const ageDisplayView = dobForDisplay
    ? `${calcAgeFromDob(dobForDisplay).years} Year(s)`
    : formData.age !== '' && formData.age != null
      ? `${formData.age} Year(s)`
      : student?.age != null
        ? `${student.age} Year(s)`
        : '—';

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
            {/* Collapsible header */}
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50/50 transition-colors"
            >
              <h3 className="text-sm font-bold text-slate-900">Student Context</h3>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-slate-500 truncate hidden sm:inline">
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
                  ].filter(Boolean).join(' · ')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Animated expandable content */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
            <div className="overflow-hidden">
            <div className={`px-5 pb-5 pt-0 border-t border-slate-100 transition-opacity duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Name</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.name || student?.name) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.name || student?.name}</span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">School</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.schoolName || student?.schoolName) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.schoolName || student?.schoolName}</span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Student ID</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.studentId || student?.studentId) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.studentId || student?.studentId}</span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Grade</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.gradeLevel || student?.gradeLevel) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.gradeLevel || student?.gradeLevel}</span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">DOB</div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const v = fmtViewDate(dobForDisplay);
                        return v === '—' ? (
                          <span className="text-sm text-slate-500">None</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{v}</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Age</div>
                    <div className="flex flex-wrap gap-2">
                      {ageDisplayView === '—' ? (
                        <span className="text-sm text-slate-500">None</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{ageDisplayView}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Contact and exceptionalities (detail)</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Address</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.address || student?.address) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 whitespace-pre-wrap break-words max-w-full">
                          {formData.address || student?.address}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1.5">Parent / Guardian</div>
                      <div className="flex flex-wrap gap-2">
                        {pillText(formData.parentGuardian1 || student?.parentGuardian1) ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.parentGuardian1 || student?.parentGuardian1}</span>
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1.5">Parent / Guardian (second)</div>
                      <div className="flex flex-wrap gap-2">
                        {pillText(formData.parentGuardian2 || student?.parentGuardian2) ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.parentGuardian2 || student?.parentGuardian2}</span>
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-medium text-slate-500 mb-1.5">Case Manager</div>
                      <div className="flex flex-wrap gap-2">
                        {pillText(formData.caseManager || student?.caseManager) ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.caseManager || student?.caseManager}</span>
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Primary exceptionality</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.primaryExceptionality || student?.primaryExceptionality) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700">{formData.primaryExceptionality || student?.primaryExceptionality}</span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Related services / therapy</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.relatedServicesTherapy || student?.relatedServicesTherapy) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 whitespace-pre-wrap break-words max-w-full">
                          {formData.relatedServicesTherapy || student?.relatedServicesTherapy}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.domainsTransitionAreas || student?.domainsTransitionAreas) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 whitespace-pre-wrap break-words max-w-full">
                          {formData.domainsTransitionAreas || student?.domainsTransitionAreas}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Domain area</div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const list = formData.domainAreas ?? student?.domainAreas;
                        return Array.isArray(list) && list.length > 0 ? (
                          list.map((d, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100">{d}</span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Associated Plan</div>
                    <div className="flex flex-wrap gap-2">
                      {pillText(formData.associatedPlans || student?.associatedPlans) ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 whitespace-pre-wrap break-words max-w-full">
                          {formData.associatedPlans || student?.associatedPlans}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </div>
                  </div>
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
            </div>
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
                  <label className="block text-xs font-medium text-slate-700 mb-2">Name <span className="text-xs text-slate-500 font-normal">— write only initials</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">School</label>
                  <input
                    type="text"
                    value={formData.schoolName || ''}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    placeholder="School or campus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Grade Level</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    required
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                  >
                    <option value="">Select grade...</option>
                    <option>KG</option>
                    <option>1st</option>
                    <option>2nd</option>
                    <option>3rd</option>
                    <option>4th</option>
                    <option>5th</option>
                    <option>6th</option>
                    <option>7th</option>
                    <option>8th</option>
                    <option>9th</option>
                    <option>10th</option>
                    <option>11th</option>
                    <option>12th</option>
                    {formData.gradeLevel &&
                      !['KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].includes(
                        formData.gradeLevel
                      ) && (
                        <option value={formData.gradeLevel}>{formData.gradeLevel}</option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const { numeric } = calcAgeFromDob(dob);
                      setFormData({ ...formData, dateOfBirth: dob, age: numeric !== '' ? String(numeric) : '' });
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Age</label>
                  {formData.dateOfBirth ? (
                    <div className="w-full h-11 px-3 border border-gray-200 rounded-md bg-slate-50 text-sm text-slate-900 flex items-center">
                      {(() => {
                        const { years } = calcAgeFromDob(formData.dateOfBirth);
                        return `${years} Year(s)`;
                      })()}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Contact and exceptionalities (detail)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      placeholder="Mailing or home address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Parent / Guardian</label>
                    <input
                      type="text"
                      value={formData.parentGuardian1 || ''}
                      onChange={(e) => setFormData({ ...formData, parentGuardian1: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Parent / Guardian (second)</label>
                    <input
                      type="text"
                      value={formData.parentGuardian2 || ''}
                      onChange={(e) => setFormData({ ...formData, parentGuardian2: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Case Manager</label>
                    <input
                      type="text"
                      value={formData.caseManager || ''}
                      onChange={(e) => setFormData({ ...formData, caseManager: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      placeholder="Staff managing this student’s case"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Primary exceptionality</label>
                    <select
                      value={formData.primaryExceptionality || ''}
                      onChange={(e) => setFormData({ ...formData, primaryExceptionality: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    >
                      <option value="">Select primary exceptionality…</option>
                      {(disabilitiesOptions || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Related services / therapy</label>
                    <textarea
                      value={formData.relatedServicesTherapy || ''}
                      onChange={(e) => setFormData({ ...formData, relatedServicesTherapy: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 resize-y"
                      placeholder="e.g. Speech, OT, counseling"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
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
                      idPrefix="sih-mp"
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
                    <label className="block text-xs font-medium text-slate-700 mb-2">Associated Plan</label>
                    <input
                      type="text"
                      value={formData.associatedPlans || ''}
                      onChange={(e) => setFormData({ ...formData, associatedPlans: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      placeholder="e.g. IEP, 504"
                    />
                  </div>
                  <div className="col-span-2">
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