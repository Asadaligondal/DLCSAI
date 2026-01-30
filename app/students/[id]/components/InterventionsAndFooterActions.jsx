import React from 'react';
import { Save, X, Wand2 } from 'lucide-react';

export function HeaderActions({ handleSaveChanges, handleResetToOriginal, handleExportToWord, isReviewed, handleRegenerateOriginal }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={handleSaveChanges}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        Save Changes
      </button>
      <button
        onClick={handleRegenerateOriginal}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        <Wand2 className="w-4 h-4" />
        Regenerate IEP
      </button>
      <button
        onClick={handleResetToOriginal}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        Reset to Original
      </button>
      <button
        onClick={handleExportToWord}
        disabled={!isReviewed}
        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
          isReviewed ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Word Doc
      </button>
    </div>
  );
}

export function FooterActions({ editablePlan, setEditablePlan, isReviewed, setIsReviewed }) {
  return (
    <>
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Intervention Recommendations</h3>
        <textarea
          value={editablePlan.intervention_recommendations}
          onChange={(e) => setEditablePlan({ ...editablePlan, intervention_recommendations: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm leading-relaxed"
          rows="6"
        />
      </div>

      <div className="p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="review-checkbox"
            checked={isReviewed}
            onChange={(e) => setIsReviewed(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="review-checkbox" className="flex-1 text-sm text-gray-900 font-medium cursor-pointer">
            I have reviewed this content for accuracy and professional standards. This IEP plan meets Florida Department of Education requirements and is ready for export.
          </label>
        </div>
      </div>
    </>
  );
}

export default function InterventionsAndFooterActions() {
  return null;
}
