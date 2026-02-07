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
    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">IEP Plan - Review & Edit</h2>

      {/* Toggle Between Original and Edited - segmented tabs, sticky inside card */}
      <div className="sticky top-0 bg-white z-10 -mx-6 px-6 pt-0 pb-4">
        <div className="inline-flex rounded-md bg-slate-50 p-1 border border-gray-100">
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'original' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Original AI Draft
          </button>
          <button
            onClick={() => setViewMode('edited')}
            className={`ml-1 px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'edited' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Current Edited Version
          </button>
        </div>
      </div>

      {/* Display Content Based on View Mode */}
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

      {/* Sticky bottom review bar inside editor container */}
      {viewMode === 'edited' && (
        <div id="final-review" style={{ scrollMarginTop: '120px' }} className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 z-20">
          <div className="max-w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="review-checkbox-sticky"
                  checked={isReviewed}
                  onChange={(e) => setIsReviewed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="review-checkbox-sticky" className="text-sm text-gray-900 font-medium cursor-pointer">
                  I have reviewed this content for accuracy and professional standards. This IEP plan meets requirements and is ready for export.
                </label>
              </div>
            </div>

            <div className="text-sm text-slate-600">Ready to export when reviewed</div>
          </div>
        </div>
      )}
    </div>
  );
}
