import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileSearch } from 'lucide-react';
import GoalsObjectivesSection from './GoalsObjectivesSection';

export default function IEPPlanEditor({
  originalAIPlan,
  editablePlan,
  viewMode,
  setViewMode,
  isReviewed,
  setIsReviewed,
  isGenerating,
  handleGenerateIEP,
  handleRegenerateOriginal,
  handleResetToOriginal,
  handleSaveChanges,
  handleExportToWord,
  removeGoal,
  removeObjective,
  updateGoal,
  updateObjective,
  setEditablePlan,
  ragContext
}) {
  const [showRagContext, setShowRagContext] = useState(false);
  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">IEP Plan - Review & Edit</h2>
      </div>

      {/* Toggle Between Original and Edited - segmented tabs, sticky inside card */}
      <div className="sticky top-0 bg-white z-10 px-6 pb-5 border-b border-slate-100">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 gap-0.5">
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'original' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Original AI Draft
          </button>
          <button
            onClick={() => setViewMode('edited')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'edited' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Current Edited Version
          </button>
        </div>
      </div>

      {/* Display Content Based on View Mode */}
      <div className="p-6">
      {viewMode === 'original' ? (
        // Original AI Draft - Read Only
        <div className="space-y-6 lg:pr-80">{/* add right padding to avoid overlap with TOC */}
          <GoalsObjectivesSection
            originalAIPlan={originalAIPlan}
            editablePlan={editablePlan}
            viewMode={viewMode}
            removeGoal={removeGoal}
            removeObjective={removeObjective}
            updateGoal={updateGoal}
            updateObjective={updateObjective}
            setEditablePlan={setEditablePlan}
          />
        </div>
      ) : (
        // Current Edited Version - Editable
        <div className="space-y-6 lg:pr-80">{/* add right padding to avoid overlap with TOC */}
          <GoalsObjectivesSection
            originalAIPlan={originalAIPlan}
            editablePlan={editablePlan}
            viewMode={viewMode}
            removeGoal={removeGoal}
            removeObjective={removeObjective}
            updateGoal={updateGoal}
            updateObjective={updateObjective}
            setEditablePlan={setEditablePlan}
          />

          <div className="h-20" /> {/* spacer so content won't be hidden behind sticky footer */}
        </div>
      )}

      {/* Raw Retrieved Context (for analysis) - collapsible dropdown, always visible */}
      <div id="raw-retrieved-context" className="mt-6 border border-amber-200 rounded-lg bg-amber-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRagContext(s => !s)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-amber-900 hover:bg-amber-100/80 transition-colors"
        >
          {showRagContext ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FileSearch className="w-4 h-4" />
          Raw Retrieved Context (for analysis)
          {ragContext ? (
            <span className="text-xs font-normal text-amber-700 ml-1">— {ragContext.length} chars</span>
          ) : (
            <span className="text-xs font-normal text-amber-600 ml-1">— not available (regenerate IEP with uploaded documents)</span>
          )}
        </button>
        {showRagContext && (
          <div className="border-t border-amber-200 p-4">
            {ragContext ? (
              <textarea
                readOnly
                value={ragContext}
                rows={16}
                className="w-full px-3 py-2.5 text-[13px] font-mono text-slate-700 bg-white border border-amber-200 rounded-lg resize-y focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            ) : (
              <p className="text-sm text-amber-800 py-4">No retrieved context from last generation. Regenerate IEP with uploaded documents to see the raw context used for goals and objectives.</p>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Sticky bottom review bar inside editor container */}
      {viewMode === 'edited' && (
        <div id="final-review" style={{ scrollMarginTop: '120px' }} className="sticky bottom-0 bg-slate-50/95 border-t border-slate-200 px-6 py-4 z-20 backdrop-blur-sm">
          <div className="max-w-full flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="review-checkbox-sticky"
                checked={isReviewed}
                onChange={(e) => setIsReviewed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500/40"
              />
              <label htmlFor="review-checkbox-sticky" className="text-sm text-slate-800 font-medium cursor-pointer leading-snug max-w-xl">
                I have reviewed this content for accuracy and professional standards. This IEP plan meets requirements and is ready for export.
              </label>
            </div>
            <div className="text-sm text-slate-500 flex-shrink-0">Ready to export when reviewed</div>
          </div>
        </div>
      )}
    </div>
  );
}
