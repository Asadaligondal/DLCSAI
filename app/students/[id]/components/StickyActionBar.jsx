"use client";

import React from 'react';
import { Save, Wand2 } from 'lucide-react';

export default function StickyActionBar({ onRegenerate, onSave, onDownload, onReset, isReviewed, isBusy, savedAt }) {
  // savedAt is optional ISO timestamp; if not provided show 'Ready'
  const statusText = savedAt ? `Saved ${savedAt}` : 'Ready';

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
              <button
                onClick={onSave}
                disabled={isBusy}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isBusy ? 'opacity-60 cursor-not-allowed bg-emerald-500' : 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>

              <button
                onClick={onRegenerate}
                disabled={isBusy}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border ${isBusy ? 'text-slate-400 border-slate-200 cursor-not-allowed bg-white' : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                <Wand2 className="w-4 h-4" />
                Regenerate IEP
              </button>

              <button
                onClick={onDownload}
                disabled={!isReviewed}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border ${isReviewed ? 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50' : 'text-slate-400 border-slate-200 cursor-not-allowed bg-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Word Doc
              </button>

              <button
                onClick={onReset}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
              >
                Reset to Original
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-2">{statusText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
