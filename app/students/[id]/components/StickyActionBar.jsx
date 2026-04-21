"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Save, Wand2, Download, ChevronDown, FileText, FileType, GraduationCap, Eye } from 'lucide-react';
import LoadingSweep from '@/components/LoadingSweep';

export default function StickyActionBar({
  onRegenerate, onSave, onDownload, onDownloadPDF, onDownloadFloridaIEP, onPreviewFloridaIEP, floridaPreviewBusy,
  onReset, isReviewed, isBusy, generateStage = 'idle', generateProgress = '',
  history = null,
  readOnly = false,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportDisabled = !isReviewed;
  const secondaryDisabled = isBusy;
  const showSweep = isBusy || floridaPreviewBusy;

  if (readOnly) {
    return (
      <div className="sticky top-16 z-30 relative overflow-visible bg-amber-50/90 backdrop-blur-sm border border-amber-200/80 rounded-xl min-h-12 flex items-center justify-between gap-3 px-3 py-2">
        <p className="text-xs font-semibold text-amber-950 shrink-0">
          Admin view — read-only. You cannot save, regenerate, reset, or export from here.
        </p>
        {history ? <div className="flex items-center gap-2 shrink-0">{history}</div> : null}
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-30 relative overflow-visible bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl h-12 flex items-center justify-end gap-2 px-3">
      {showSweep ? <LoadingSweep /> : null}
      <div className="relative z-[6] flex h-full w-full items-center justify-end gap-2 min-w-0">
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
                {onPreviewFloridaIEP && (
                  <button
                    type="button"
                    onClick={() => { onPreviewFloridaIEP(); setExportOpen(false); }}
                    disabled={exportDisabled || floridaPreviewBusy}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4 text-indigo-500" />
                    {floridaPreviewBusy ? 'Building preview…' : 'Preview Florida IEP (PDF)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { onDownloadFloridaIEP(); setExportOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  Download Florida IEP
                </button>
              </div>
            )}
          </div>

          {history ? (
            <>
              <div className="w-px h-6 bg-slate-200 mx-0.5" />
              {history}
            </>
          ) : null}
      </div>
    </div>
  );
}
