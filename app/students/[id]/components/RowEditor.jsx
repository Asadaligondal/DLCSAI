"use client";

import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function RowEditor({ index, value, onChange, onDelete, placeholder, badgeColor = 'bg-slate-300', tag }) {
  const taRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(240, ta.scrollHeight)}px`;
  }, [value]);

  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-slate-50/70 rounded-lg transition-colors group">
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1.5">
        <div className={`w-6 h-6 ${badgeColor} text-white rounded-md flex items-center justify-center text-[11px] font-bold`}>{Number.isFinite(index) ? index + 1 : '?'}</div>
        {tag}
      </div>

      <div className="flex-1 min-w-0">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[14px] leading-relaxed resize-none overflow-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-shadow"
          rows={2}
        />
        {focused && (
          <div className="text-xs text-slate-400 mt-1">Keep SMART + accommodations in condition</div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className={`mt-1.5 p-1.5 rounded-lg transition-colors ${onDelete ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100' : 'invisible'}`}
        title="Remove"
        disabled={!onDelete}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
