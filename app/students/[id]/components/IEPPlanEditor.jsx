import React from 'react';
import { Save, X, Wand2 } from 'lucide-react';
import GoalsObjectivesSection from './GoalsObjectivesSection';
import { HeaderActions, FooterActions } from './InterventionsAndFooterActions';

export default function IEPPlanEditor({
  originalAIPlan,
  editablePlan,
  viewMode,
  setViewMode,
  isReviewed,
  setIsReviewed,
  isGenerating,
  handleGenerateIEP,
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">IEP Plan - Review & Edit</h2>
        <HeaderActions
          handleSaveChanges={handleSaveChanges}
          handleResetToOriginal={handleResetToOriginal}
          handleExportToWord={handleExportToWord}
          isReviewed={isReviewed}
        />
      </div>

      {/* Toggle Between Original and Edited */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('original')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'original' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Original AI Draft (Read-Only)
        </button>
        <button
          onClick={() => setViewMode('edited')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'edited' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Current Edited Version
        </button>
      </div>

      {/* Display Content Based on View Mode */}
      {viewMode === 'original' ? (
        // Original AI Draft - Read Only
        <div className="space-y-6">
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
        <div className="space-y-6">
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

          <FooterActions
            editablePlan={editablePlan}
            setEditablePlan={setEditablePlan}
            isReviewed={isReviewed}
            setIsReviewed={setIsReviewed}
          />
        </div>
      )}
    </div>
  );
}
