"use client";

import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function RowEditor({ index, value, onChange, onDelete, placeholder, badgeColor = 'bg-slate-300' }) {
  const taRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(240, ta.scrollHeight)}px`;
  }, [value]);

  return (
    <div className="flex items-start gap-4 py-3 px-3 hover:bg-slate-50/70 rounded-lg transition-colors group">
      <div className={`flex-shrink-0 w-7 h-7 ${badgeColor} text-white rounded-lg flex items-center justify-center text-xs font-semibold`}>{Number.isFinite(index) ? index + 1 : '?'}</div>

      <div className="flex-1 min-w-0">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[15px] leading-relaxed resize-none overflow-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-shadow"
          rows={2}
        />
        {focused && (
          <div className="text-xs text-slate-400 mt-1.5">Keep SMART + accommodations in condition</div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className={`mt-1 p-2 rounded-lg transition-colors ${onDelete ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100' : 'invisible'}`}
        title="Remove"
        disabled={!onDelete}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
