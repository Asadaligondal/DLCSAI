import React from 'react';
import { Save, X } from 'lucide-react';
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
  setEditablePlan
}) {
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
