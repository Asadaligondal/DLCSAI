"use client";

import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { MEETING_PURPOSE_OPTIONS, summarizeMeetingPurpose } from '@/lib/meetingPurposeChecklist';

function emitChange(tags, otherText, onChange) {
  const t = Array.isArray(tags) ? [...tags] : [];
  const o = otherText != null ? String(otherText) : '';
  let nextTags = t;
  if (o.trim() && !nextTags.includes('mp_other')) nextTags = [...nextTags, 'mp_other'];
  if (!o.trim()) nextTags = nextTags.filter((id) => id !== 'mp_other');
  onChange({
    meetingPurposeTags: nextTags,
    meetingPurposeOther: o.trim() ? o : '',
    meetingPurpose: summarizeMeetingPurpose(nextTags, o.trim() ? o : ''),
  });
}

export default function MeetingPurposeCollapsible({
  tags = [],
  otherText = '',
  onChange,
  idPrefix = 'mp',
}) {
  const [open, setOpen] = useState(false);
  const tagSet = useMemo(() => new Set(Array.isArray(tags) ? tags : []), [tags]);
  const otherTrim = (otherText && String(otherText).trim()) || '';
  const hasData =
    (Array.isArray(tags) && tags.some((id) => id && id !== 'mp_other')) || !!otherTrim;

  const col = (n) => MEETING_PURPOSE_OPTIONS.filter((o) => o.col === n);

  const toggle = (id) => {
    const t = Array.isArray(tags) ? [...tags] : [];
    let next = t.includes(id) ? t.filter((x) => x !== id) : [...t, id];
    let o = otherText != null ? String(otherText) : '';
    if (id === 'mp_other' && !next.includes('mp_other')) o = '';
    emitChange(next, o, onChange);
  };

  const setOther = (val) => {
    emitChange(Array.isArray(tags) ? [...tags] : [], val, onChange);
  };

  const nSelected =
    (Array.isArray(tags) ? tags.filter((id) => id && id !== 'mp_other').length : 0) + (otherTrim ? 1 : 0);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800 bg-[#a3b18a]/25 hover:bg-[#a3b18a]/35 transition-colors"
      >
        <span>
          {hasData ? `Meeting purpose (${nSelected} selected)` : 'Add meeting purpose'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 py-3 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-600">Check all that apply.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[1, 2, 3].map((c) => (
              <div key={c} className="space-y-2 min-w-0">
                {col(c).map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex gap-2 items-start cursor-pointer ${opt.starred ? 'pl-0' : ''}`}
                  >
                    <input
                      type="checkbox"
                      id={`${idPrefix}-${opt.id}`}
                      checked={tagSet.has(opt.id)}
                      onChange={() => toggle(opt.id)}
                      className="mt-0.5 rounded border-slate-300 shrink-0"
                    />
                    <span className="text-slate-700 leading-snug">
                      {opt.starred ? <span className="text-slate-900">*</span> : null}
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          {tagSet.has('mp_other') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Other (specify)</label>
              <textarea
                value={otherText || ''}
                onChange={(e) => setOther(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 resize-y min-h-[48px]"
              />
            </div>
          )}
          <p className="text-[10px] italic text-slate-500 leading-snug">
            * The parent must have received a meeting notice at least 10 days prior when access points, alternate assessment,
            or center school placement are considered, unless they consent to an earlier meeting.
          </p>
        </div>
      )}
    </div>
  );
}
