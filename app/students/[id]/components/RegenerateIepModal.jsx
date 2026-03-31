"use client";

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Wand2 } from 'lucide-react';

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

/** Original plan date + 1 year − 1 calendar day */
function reviewDurationFromOriginal(originalYmd) {
  const o = parseLocalYMD(originalYmd);
  if (!o) return '';
  const t = new Date(o.getFullYear(), o.getMonth(), o.getDate());
  t.setFullYear(t.getFullYear() + 1);
  t.setDate(t.getDate() - 1);
  return formatLocalYMD(t);
}

/** Original plan date + 3 years */
function reevaluationFromOriginal(originalYmd) {
  const o = parseLocalYMD(originalYmd);
  if (!o) return '';
  const t = new Date(o.getFullYear(), o.getMonth(), o.getDate());
  t.setFullYear(t.getFullYear() + 3);
  return formatLocalYMD(t);
}

export default function RegenerateIepModal({
  isOpen,
  onClose,
  onConfirm,
  student,
  busy
}) {
  const [generationType, setGenerationType] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [originalMeetingPlanDate, setOriginalMeetingPlanDate] = useState('');
  const [reviewDurationDate, setReviewDurationDate] = useState('');
  const [reevaluationDueDate, setReevaluationDueDate] = useState('');
  const [initiationDate, setInitiationDate] = useState('');
  const [amendmentDate, setAmendmentDate] = useState('');
  const [persistProfile, setPersistProfile] = useState(true);

  useEffect(() => {
    if (!isOpen || !student) return;
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
  }, [isOpen, student]);

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
    if (!generationType) {
      return;
    }
    onConfirm({
      generationType,
      meetingPurpose,
      originalMeetingPlanDate,
      reviewDueDate: reviewDurationDate,
      reevaluationDueDate,
      initiationDate,
      durationDate: reviewDurationDate,
      amendmentDate,
      persistProfile
    });
  };

  return (
    <Modal
      isOpen={!!isOpen}
      onClose={() => { if (!busy) onClose(); }}
      title="Generate IEP"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
        <p className="text-sm text-slate-600">
          Set how this run should be framed (Florida-style meeting context). This information is sent to the AI and can be saved to the student profile.
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
            Save meeting type, purpose, dates, and amendment fields above to this student&apos;s profile
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
  );
}
