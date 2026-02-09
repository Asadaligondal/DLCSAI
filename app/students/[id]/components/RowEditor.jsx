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
    <div className="flex items-start gap-3 py-2 hover:bg-slate-50 p-1 rounded">
      <div className={`flex-shrink-0 w-6 h-6 ${badgeColor} text-white rounded-full flex items-start justify-center text-xs font-semibold pt-1`}>{Number.isFinite(index) ? index + 1 : '?'}</div>

      <div className="flex-1">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full px-2 py-1 border border-gray-200 rounded text-sm leading-tight resize-none overflow-hidden"
          rows={2}
        />
        {focused && (
          <div className="text-xs text-gray-400 mt-1">Keep SMART + accommodations in condition</div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-1 p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
