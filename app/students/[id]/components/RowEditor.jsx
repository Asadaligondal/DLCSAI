"use client";

import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function RowEditor({ index, value, onChange, onDelete, placeholder, badgeColor = 'bg-slate-300' }) {
  const taRef = useRef(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(200, ta.scrollHeight)}px`;
  }, [value]);

  return (
    <div className="flex items-start gap-2 py-0.5 px-1.5 hover:bg-slate-50/70 rounded-md transition-colors group">
      <div className="flex-shrink-0 pt-1">
        <div className={`w-5 h-5 ${badgeColor} text-white rounded flex items-center justify-center text-[10px] font-bold`}>{Number.isFinite(index) ? index + 1 : '?'}</div>
      </div>

      <div className="flex-1 min-w-0">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1 border border-slate-200 rounded-md text-[13px] leading-snug resize-none overflow-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-shadow"
          rows={1}
        />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className={`mt-0.5 p-1 rounded-md transition-colors ${onDelete ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100' : 'invisible'}`}
        title="Remove"
        disabled={!onDelete}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
