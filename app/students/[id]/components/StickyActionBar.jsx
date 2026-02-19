"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Save, Wand2, Download, ChevronDown, FileText, FileType } from 'lucide-react';

export default function StickyActionBar({ onRegenerate, onSave, onDownload, onReset, isReviewed, isBusy, savedAt }) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  // savedAt is optional ISO timestamp; if not provided show 'Ready'
  const statusText = savedAt ? `Saved ${savedAt}` : 'Ready';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportDisabled = !isReviewed;
  const secondaryDisabled = isBusy;

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 60 }} className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-full px-8 py-4">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-900">IEP Writer</div>
            <div className="text-xs text-slate-500 mt-0.5">Review & Edit</div>
          </div>

          <div className="ml-auto flex flex-col items-end">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Primary: Save Changes */}
              <button
                onClick={onSave}
                disabled={isBusy}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isBusy ? 'opacity-60 cursor-not-allowed bg-emerald-500' : 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>

              <div className="w-px h-8 bg-slate-200 shrink-0 mx-1" aria-hidden />

              {/* Secondary: Regenerate, Reset */}
              <button
                onClick={onRegenerate}
                disabled={secondaryDisabled}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border ${secondaryDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                <Wand2 className="w-4 h-4" />
                Regenerate IEP
              </button>

              <button
                onClick={onReset}
                disabled={secondaryDisabled}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border ${secondaryDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                Reset to Original
              </button>

              <div className="w-px h-8 bg-slate-200 shrink-0 mx-1" aria-hidden />

              {/* Export dropdown */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => !exportDisabled && setExportOpen((o) => !o)}
                  disabled={exportDisabled}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border ${exportDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50'}`}
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className={`w-4 h-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
                </button>

                {exportOpen && (
                  <div className="absolute right-0 mt-1 w-52 py-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        onDownload();
                        setExportOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                    >
                      <FileType className="w-4 h-4 text-slate-500" />
                      Word Document (.docx)
                    </button>
                    <button
                      disabled
                      title="Coming soon"
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed text-left"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                      <span className="ml-auto text-xs text-slate-400">Coming soon</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-2">{statusText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
