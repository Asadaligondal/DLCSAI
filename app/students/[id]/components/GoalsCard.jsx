"use client";

import React from 'react';
import { Target, Wand2 } from 'lucide-react';
import SectionCard from './SectionCard';

export default function GoalsCard({
  student,
  onCustomizeGoals,
  isGenerating,
  handleGenerateIEP,
  hasExistingPlan
}) {
  const goals = Array.isArray(student?.assignedGoals) ? student.assignedGoals : [];

  const actionGroup = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <button
        type="button"
        onClick={() => (onCustomizeGoals ? onCustomizeGoals() : null)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto ${goals.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        <Target className="w-4 h-4" />
        {goals.length > 0 ? 'View Custom Goals' : 'Customize Goals'}
      </button>
    </div>
  );

  return (
    <SectionCard
      id="goals"
      title="Goals"
      subtitle="Manage custom goals and regeneration."
      rightUtilities={actionGroup}
    >
      <div className="space-y-3">
        {goals.length > 0 ? (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div key={goal._id} className="flex items-start justify-between p-3 border border-gray-100 rounded-md hover:border-blue-200 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{goal.title}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{goal.description}</div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{goal.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 bg-gray-50 rounded-md flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">—</div>
              <div className="text-sm text-gray-600">No custom goals yet</div>
              <div className="text-xs text-gray-500 mt-1">Click “Customize Goals” to add.</div>
            </div>
          </div>
        )}

        {!hasExistingPlan && (
          <button
            onClick={handleGenerateIEP}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate IEP Plan'}
          </button>
        )}
      </div>
    </SectionCard>
  );
}