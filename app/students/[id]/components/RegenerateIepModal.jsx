"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '@/components/Modal';
import MultiSelect from '@/components/MultiSelect';
import AccommodationsModal from '@/components/AccommodationsModal';
import { Wand2 } from 'lucide-react';
import { DOMAIN_AREA_OPTIONS } from '@/lib/domainAreas';

const GENERATION_TYPES = [
  { value: '', label: 'Select type…' },
  { value: 'Annual review', label: 'Annual review' },
  { value: 'Amendment', label: 'Amendment' },
  { value: 'Triennial / Reevaluation', label: 'Triennial / Reevaluation' },
  { value: 'Initial IEP', label: 'Initial IEP' },
  { value: 'Other', label: 'Other' }
];

function toDateInput(d) {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function parseLocalYMD(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2] - 1;
  const da = +m[3];
  const dt = new Date(y, mo, da);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== da) return null;
  return dt;
}

function formatLocalYMD(dt) {
  if (!dt || Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function reviewDurationFromOriginal(originalYmd) {
  const o = parseLocalYMD(originalYmd);
  if (!o) return '';
  const t = new Date(o.getFullYear(), o.getMonth(), o.getDate());
  t.setFullYear(t.getFullYear() + 1);
  t.setDate(t.getDate() - 1);
  return formatLocalYMD(t);
}

function reevaluationFromOriginal(originalYmd) {
  const o = parseLocalYMD(originalYmd);
  if (!o) return '';
  const t = new Date(o.getFullYear(), o.getMonth(), o.getDate());
  t.setFullYear(t.getFullYear() + 3);
  return formatLocalYMD(t);
}

function cloneAcc(acc) {
  const empty = {
    consent: { parentConsentRequired: false, parentConsentObtained: false, consentNotes: '', parentConsentName: '', parentConsentDate: '' },
    classroom: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] },
    assessment: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] }
  };
  if (!acc || typeof acc !== 'object') return JSON.parse(JSON.stringify(empty));
  try {
    return JSON.parse(JSON.stringify(acc));
  } catch {
    return JSON.parse(JSON.stringify(empty));
  }
}

function countAcc(acc) {
  let n = 0;
  if (!acc) return 0;
  for (const scope of ['classroom', 'assessment']) {
    const o = acc[scope];
    if (!o || typeof o !== 'object') continue;
    for (const arr of Object.values(o)) {
      if (Array.isArray(arr)) n += arr.length;
    }
  }
  return n;
}

function goalSig(g) {
  return `${g?.title || ''}\n${g?.description || ''}\n${g?._id || ''}`;
}

export default function RegenerateIepModal({
  isOpen,
  onClose,
  onConfirm,
  student,
  busy,
  profileForm,
  customGoals: customGoalsProp = [],
  disabilitiesOptions = [],
  strengthsOptions = [],
  weaknessesOptions = []
}) {
  const wasOpenRef = useRef(false);

  const [generationType, setGenerationType] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [originalMeetingPlanDate, setOriginalMeetingPlanDate] = useState('');
  const [reviewDurationDate, setReviewDurationDate] = useState('');
  const [reevaluationDueDate, setReevaluationDueDate] = useState('');
  const [initiationDate, setInitiationDate] = useState('');
  const [amendmentDate, setAmendmentDate] = useState('');
  const [persistProfile, setPersistProfile] = useState(true);

  const [gradeLevel, setGradeLevel] = useState('');
  const [caseManager, setCaseManager] = useState('');
  const [disabilities, setDisabilities] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [primaryExceptionality, setPrimaryExceptionality] = useState('');
  const [relatedServicesTherapy, setRelatedServicesTherapy] = useState('');
  const [domainsTransitionAreas, setDomainsTransitionAreas] = useState('');
  const [associatedPlans, setAssociatedPlans] = useState('');
  const [domainAreas, setDomainAreas] = useState([]);
  const [localGoals, setLocalGoals] = useState([]);
  const [accDraft, setAccDraft] = useState(() => cloneAcc(null));
  const [showAccModal, setShowAccModal] = useState(false);

  const baseline = useMemo(() => {
    if (!isOpen || !student || !profileForm) return null;
    return {
      disabilities: [...(profileForm.disabilities || [])],
      strengths: [...(profileForm.strengths || [])],
      weaknesses: [...(profileForm.weaknesses || [])],
      gradeLevel: profileForm.gradeLevel || '',
      caseManager: profileForm.caseManager || '',
      primaryExceptionality: profileForm.primaryExceptionality || '',
      relatedServicesTherapy: profileForm.relatedServicesTherapy || '',
      domainsTransitionAreas: profileForm.domainsTransitionAreas || '',
      associatedPlans: profileForm.associatedPlans || '',
      domainAreas: [...(profileForm.domainAreas || [])],
      accStr: JSON.stringify(cloneAcc(student.student_accommodations)),
      goalSigs: new Set((customGoalsProp || []).map(goalSig))
    };
  }, [isOpen, student, profileForm, customGoalsProp]);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (!student || !profileForm || wasOpenRef.current) return;
    wasOpenRef.current = true;

    setGenerationType(student.generationType || '');
    setMeetingPurpose(student.meetingPurpose || '');
    const orig = toDateInput(student.originalMeetingPlanDate);
    setOriginalMeetingPlanDate(orig);
    if (orig) {
      setReviewDurationDate(reviewDurationFromOriginal(orig));
      setReevaluationDueDate(reevaluationFromOriginal(orig));
    } else {
      setReviewDurationDate(toDateInput(student.reviewDueDate || student.durationDate));
      setReevaluationDueDate(toDateInput(student.reevaluationDueDate));
    }
    setInitiationDate(toDateInput(student.initiationDate));
    setAmendmentDate(toDateInput(student.amendmentDate));
    setPersistProfile(true);

    setGradeLevel(profileForm.gradeLevel || '');
    setCaseManager(profileForm.caseManager || '');
    setDisabilities([...(profileForm.disabilities || [])]);
    setStrengths([...(profileForm.strengths || [])]);
    setWeaknesses([...(profileForm.weaknesses || [])]);
    setPrimaryExceptionality(profileForm.primaryExceptionality || '');
    setRelatedServicesTherapy(profileForm.relatedServicesTherapy || '');
    setDomainsTransitionAreas(profileForm.domainsTransitionAreas || '');
    setAssociatedPlans(profileForm.associatedPlans || '');
    setDomainAreas([...(profileForm.domainAreas || [])]);

    const goalsCopy = (customGoalsProp || []).map((x) => ({ ...x }));
    setLocalGoals(goalsCopy);
    setAccDraft(cloneAcc(student.student_accommodations));
  }, [isOpen, student, profileForm, customGoalsProp]);

  const handleOriginalPlanChange = (value) => {
    setOriginalMeetingPlanDate(value);
    if (value) {
      setReviewDurationDate(reviewDurationFromOriginal(value));
      setReevaluationDueDate(reevaluationFromOriginal(value));
    } else {
      setReviewDurationDate('');
      setReevaluationDueDate('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!generationType) return;

    onConfirm({
      generationType,
      meetingPurpose,
      originalMeetingPlanDate,
      reviewDueDate: reviewDurationDate,
      reevaluationDueDate,
      initiationDate,
      durationDate: reviewDurationDate,
      amendmentDate,
      persistProfile,
      profile: {
        gradeLevel,
        caseManager,
        disabilities,
        strengths,
        weaknesses,
        primaryExceptionality,
        relatedServicesTherapy,
        domainsTransitionAreas,
        associatedPlans,
        domainAreas,
        student_accommodations: accDraft
      },
      customGoals: localGoals
    });
  };

  const accChanged = baseline && JSON.stringify(accDraft) !== baseline.accStr;

  return (
    <>
      <Modal
        isOpen={!!isOpen}
        onClose={() => { if (!busy) onClose(); }}
        title="Generate IEP"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4 max-h-[min(80vh,720px)] overflow-y-auto">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">{student?.name || 'Student'}</p>
              <p className="text-xs text-slate-500">ID: {student?.studentId || '—'} (reference only)</p>
            </div>
            <p className="text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded bg-slate-200 border border-slate-300" /> From profile</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-sky-200 border border-sky-300" /> New / changed</span>
            </p>
          </div>

          <p className="text-sm text-slate-600">
            Review or adjust context for this generation. Slate tags match the profile when you opened this form; sky highlights new or edited values.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Generation / meeting type *</label>
            <select
              value={generationType}
              onChange={(e) => setGenerationType(e.target.value)}
              required
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {GENERATION_TYPES.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Meeting purpose / focus</label>
            <textarea
              value={meetingPurpose}
              onChange={(e) => setMeetingPurpose(e.target.value)}
              rows={2}
              placeholder="e.g. annual review, discuss reading goals"
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y min-h-[72px]"
            />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Student context</p>
            <div className={gradeLevel !== baseline?.gradeLevel ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Grade</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
              />
            </div>
            <div className={caseManager !== baseline?.caseManager ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Case Manager</label>
              <input
                type="text"
                value={caseManager}
                onChange={(e) => setCaseManager(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
                placeholder="Staff managing this student’s case"
              />
            </div>

            <MultiSelect
              label="Exceptionalities (disabilities list)"
              options={disabilitiesOptions}
              value={disabilities}
              onChange={setDisabilities}
              baselineValues={baseline?.disabilities}
            />
            <MultiSelect
              label="Strengths"
              options={strengthsOptions}
              value={strengths}
              onChange={setStrengths}
              baselineValues={baseline?.strengths}
            />
            <MultiSelect
              label="Weaknesses / areas of need"
              options={weaknessesOptions}
              value={weaknesses}
              onChange={setWeaknesses}
              baselineValues={baseline?.weaknesses}
            />

            <div className={primaryExceptionality !== baseline?.primaryExceptionality ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Primary exceptionality</label>
              <select
                value={primaryExceptionality}
                onChange={(e) => setPrimaryExceptionality(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
              >
                <option value="">Select primary exceptionality…</option>
                {(disabilitiesOptions || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <MultiSelect
              label="Domain area"
              options={DOMAIN_AREA_OPTIONS}
              value={domainAreas}
              onChange={setDomainAreas}
              baselineValues={baseline?.domainAreas}
              placeholder="Select domain area(s)…"
            />
            <div className={associatedPlans !== baseline?.associatedPlans ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Associated Plan</label>
              <input
                type="text"
                value={associatedPlans}
                onChange={(e) => setAssociatedPlans(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
                placeholder="e.g. IEP, 504"
              />
            </div>
            <div className={relatedServicesTherapy !== baseline?.relatedServicesTherapy ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Related services / therapy</label>
              <input
                type="text"
                value={relatedServicesTherapy}
                onChange={(e) => setRelatedServicesTherapy(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
              />
            </div>
            <div className={domainsTransitionAreas !== baseline?.domainsTransitionAreas ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-2' : ''}>
              <label className="block text-xs text-slate-600 mb-1">Domains / transition areas</label>
              <input
                type="text"
                value={domainsTransitionAreas}
                onChange={(e) => setDomainsTransitionAreas(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
              />
            </div>

            <div className={accChanged ? 'rounded-md border border-sky-200/90 bg-sky-50/30 p-3' : 'rounded-md border border-slate-100 p-3'}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-600">Accommodations</p>
                  <p className="text-xs text-slate-500">{countAcc(accDraft)} selected (classroom + assessment)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccModal(true)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Edit…
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Custom goals (for this generation)</p>
              <div className="space-y-2">
                {localGoals.map((g, i) => {
                  const isNew = baseline && !baseline.goalSigs.has(goalSig(g));
                  return (
                    <div
                      key={i}
                      className={`grid gap-2 sm:grid-cols-[1fr_1fr_auto] border rounded-md p-2 ${isNew ? 'border-sky-200 bg-sky-50/25' : 'border-slate-200 bg-slate-50/40'}`}
                    >
                      <input
                        type="text"
                        placeholder="Title"
                        value={g.title || ''}
                        onChange={(e) => {
                          const next = [...localGoals];
                          next[i] = { ...next[i], title: e.target.value };
                          setLocalGoals(next);
                        }}
                        className="h-9 px-2 border border-gray-200 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={g.description || ''}
                        onChange={(e) => {
                          const next = [...localGoals];
                          next[i] = { ...next[i], description: e.target.value };
                          setLocalGoals(next);
                        }}
                        className="h-9 px-2 border border-gray-200 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setLocalGoals(localGoals.filter((_, j) => j !== i))}
                        className="h-9 px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setLocalGoals([...localGoals, { title: '', description: '' }])}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  + Add goal
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Key dates (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Original meeting / plan</label>
                <input
                  type="date"
                  value={originalMeetingPlanDate}
                  onChange={(e) => handleOriginalPlanChange(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-200 rounded-md bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Review / duration date</label>
                <input
                  type="date"
                  value={reviewDurationDate}
                  onChange={(e) => setReviewDurationDate(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-200 rounded-md bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Reevaluation due</label>
                <input
                  type="date"
                  value={reevaluationDueDate}
                  onChange={(e) => setReevaluationDueDate(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-200 rounded-md bg-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Initiation date</label>
                <input
                  type="date"
                  value={initiationDate}
                  onChange={(e) => setInitiationDate(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-200 rounded-md bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Amendment date</label>
                <input
                  type="date"
                  value={amendmentDate}
                  onChange={(e) => setAmendmentDate(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-200 rounded-md bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={persistProfile}
              onChange={(e) => setPersistProfile(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              Save everything above (dates + student context) to this student&apos;s profile
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-10 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !generationType}
              className="h-10 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              {busy ? 'Working…' : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>

      {showAccModal && (
        <AccommodationsModal
          initial={accDraft}
          onClose={() => setShowAccModal(false)}
          onSave={(payload) => { setAccDraft(payload); }}
        />
      )}
    </>
  );
}
