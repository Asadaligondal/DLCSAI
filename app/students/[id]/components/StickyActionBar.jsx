"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Save, Wand2, Download, ChevronDown, FileText, FileType, GraduationCap } from 'lucide-react';

export default function StickyActionBar({ onRegenerate, onSave, onDownload, onDownloadPDF, onDownloadFloridaIEP, onReset, isReviewed, isBusy, savedAt, generateStage = 'idle', generateProgress = '' }) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  const progressLabel = generateStage === 'retrieving_context' ? 'Retrieving context...' : generateStage === 'generating_iep' ? (generateProgress || 'Generating IEP...') : null;
  const statusText = isBusy && progressLabel ? progressLabel : savedAt ? `Saved ${savedAt}` : 'Ready';

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportDisabled = !isReviewed;
  const secondaryDisabled = isBusy;

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 60 }} className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60">
      <div className="max-w-full px-8 h-12 flex items-center justify-end gap-2">
          <button
            onClick={onSave}
            disabled={isBusy}
            className={`flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-semibold rounded-lg transition-all ${isBusy ? 'opacity-50 cursor-not-allowed bg-emerald-500 text-white' : 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md'}`}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          <div className="w-px h-6 bg-slate-200 mx-0.5" />

          <button
            onClick={onRegenerate}
            disabled={secondaryDisabled}
            className={`flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-medium rounded-lg transition-colors border ${secondaryDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <Wand2 className={`w-3.5 h-3.5 ${isBusy ? 'animate-pulse' : ''}`} />
            {isBusy && generateStage === 'retrieving_context' ? 'Retrieving...' : isBusy && generateStage === 'generating_iep' ? (generateProgress || 'Generating...') : 'Regenerate'}
          </button>

          <button
            onClick={onReset}
            disabled={secondaryDisabled}
            className={`flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-medium rounded-lg transition-colors border ${secondaryDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            Reset
          </button>

          <div className="w-px h-6 bg-slate-200 mx-0.5" />

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => !exportDisabled && setExportOpen((o) => !o)}
              disabled={exportDisabled}
              className={`flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-medium rounded-lg transition-colors border ${exportDisabled ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-52 py-1 bg-white border border-slate-200/60 rounded-xl shadow-float z-50">
                <button
                  onClick={() => { onDownload(); setExportOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <FileType className="w-4 h-4 text-slate-400" />
                  Word (.docx)
                </button>
                <button
                  onClick={() => { onDownloadPDF(); setExportOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  PDF (.pdf)
                </button>
                <div className="mx-2 border-t border-slate-100" />
                <button
                  onClick={() => { onDownloadFloridaIEP(); setExportOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  Florida IEP Format
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200 mx-0.5" />
          <span className="text-[11px] text-slate-500 min-w-0 truncate max-w-[140px]">{statusText}</span>
      </div>
    </div>
  );
}
