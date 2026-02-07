"use client";

import React from 'react';
import { Save, Wand2 } from 'lucide-react';

export default function StickyActionBar({ onRegenerate, onSave, onDownload, onReset, isReviewed, isBusy }) {
  return (
    <div style={{ position: 'sticky', top: '64px', zIndex: 40 }} className="bg-white border-b border-slate-200">
      <div className="max-w-full px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onRegenerate}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              Regenerate IEP
            </button>

            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>

            <button
              onClick={onDownload}
              disabled={!isReviewed}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isReviewed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Word Doc
            </button>

            <button
              onClick={onReset}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset to Original
            </button>
          </div>

          <div className="text-sm text-slate-600 ml-auto">{/* status placeholder - controlled externally if desired */}</div>
        </div>
      </div>
    </div>
  );
}
