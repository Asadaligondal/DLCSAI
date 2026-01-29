import React from 'react';
import { X } from 'lucide-react';

export default function GoalsObjectivesSection({
  originalAIPlan,
  editablePlan,
  viewMode,
  removeGoal,
  removeObjective,
  updateGoal,
  updateObjective,
  setEditablePlan
}) {
  // Helpers to update grouped goals/objectives inside editablePlan
  const updateGroupedGoal = (groupIdx, goalIdx, value) => {
    setEditablePlan(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      if (!Array.isArray(next.annualGoalsByExceptionality)) return prev;
      if (!next.annualGoalsByExceptionality[groupIdx]) return prev;
      if (!Array.isArray(next.annualGoalsByExceptionality[groupIdx].goals)) return prev;
      next.annualGoalsByExceptionality[groupIdx].goals[goalIdx].goal = value;
      return next;
    });
  };

  const updateGroupedObjective = (groupIdx, objIdx, value) => {
    setEditablePlan(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      if (!Array.isArray(next.shortTermObjectivesByExceptionality)) return prev;
      if (!next.shortTermObjectivesByExceptionality[groupIdx]) return prev;
      if (!Array.isArray(next.shortTermObjectivesByExceptionality[groupIdx].objectives)) return prev;
      next.shortTermObjectivesByExceptionality[groupIdx].objectives[objIdx].objective = value;
      return next;
    });
  };
  return (
    <>
      {/* PLAAFP first for Original view */}
      {viewMode === 'original' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">PLAAFP Narrative</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.plaafp_narrative}</p>
        </div>
      )}

      {/* PLAAFP + Annual Goals + Objectives (flat lists) */}
      {viewMode === 'original' ? (
        <>
          {/* Grouped Goals & Objectives by Exceptionality (second) */}
          {originalAIPlan.annualGoalsByExceptionality && originalAIPlan.annualGoalsByExceptionality.length > 0 && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals & Objectives by Exceptionality</h3>
              <div className="space-y-4">
                {originalAIPlan.annualGoalsByExceptionality.map((group) => (
                  <div key={group.exceptionality} className="p-3 bg-white border border-gray-100 rounded">
                    <div className="text-sm font-medium text-gray-800 mb-2">{group.exceptionality}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {group.goals?.map((g, gi) => (
                        <div key={`g-${g.referenceId}-${gi}`} className="flex gap-3 items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(g.referenceId, 10) + 1}</div>
                          <p className="text-gray-700 text-sm">{g.goal}</p>
                        </div>
                      ))}

                      {originalAIPlan.shortTermObjectivesByExceptionality && originalAIPlan.shortTermObjectivesByExceptionality.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-600 mb-2">Short-Term Objectives</div>
                          <div className="space-y-2">
                            { (originalAIPlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives || []).map((o) => (
                              <div key={`o-${o.referenceId}`} className="flex gap-3 items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(o.referenceId, 10) + 1}</div>
                                <p className="text-gray-700 text-sm">{o.objective}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Annual Goals</h3>
            <ul className="space-y-2">
              {originalAIPlan.annual_goals?.map((goal, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                  <p className="text-gray-700 text-sm pt-0.5">{goal}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Short-Term Objectives</h3>
            <ul className="space-y-2">
              {originalAIPlan.short_term_objectives?.map((objective, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                  <p className="text-gray-700 text-sm pt-0.5">{objective}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Intervention Recommendations</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.intervention_recommendations}</p>
          </div>
        </>
      ) : (
        // Edited view: editable lists
        <>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">PLAAFP Narrative</h3>
            <textarea
              value={editablePlan.plaafp_narrative}
              onChange={(e) => setEditablePlan({ ...editablePlan, plaafp_narrative: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
              rows="8"
            />
          </div>

          {/* Grouped snapshot shown above flat editable lists in the original implementation; keep same behavior */}
          { (editablePlan.annualGoalsByExceptionality && editablePlan.annualGoalsByExceptionality.length > 0) && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals & Objectives by Exceptionality (LLM)</h3>
              <div className="space-y-4">
                {editablePlan.annualGoalsByExceptionality.map((group, gIdx) => (
                  <div key={group.exceptionality} className="p-3 bg-white border border-gray-100 rounded">
                    <div className="text-sm font-medium text-gray-800 mb-2">{group.exceptionality}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {group.goals?.map((g, gi) => (
                        <div key={`eg-${g.referenceId}`} className="flex gap-3 items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(g.referenceId, 10) + 1}</div>
                          <textarea
                            value={g.goal}
                            onChange={(e) => updateGroupedGoal(gIdx, gi, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                            rows={2}
                          />
                        </div>
                      ))}
                      {editablePlan.shortTermObjectivesByExceptionality && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-600 mb-2">Short-Term Objectives</div>
                          <div className="space-y-2">
                            {(editablePlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives || []).map((o, oi) => {
                              const objGroupIndex = editablePlan.shortTermObjectivesByExceptionality.findIndex(sg => sg.exceptionality === group.exceptionality);
                              return (
                                <div key={`eo-${o.referenceId}`} className="flex gap-3 items-start">
                                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(o.referenceId, 10) + 1}</div>
                                  <textarea
                                    value={o.objective}
                                    onChange={(e) => updateGroupedObjective(objGroupIndex, oi, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                                    rows={2}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Annual Goals</h3>
            <div className="space-y-3">
              {editablePlan.annual_goals?.map((goal, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">{index + 1}</span>
                  <textarea
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    rows="2"
                  />
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    className="mt-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove goal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Short-Term Objectives</h3>
            <div className="space-y-3">
              {editablePlan.short_term_objectives?.map((objective, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">{index + 1}</span>
                  <textarea
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows="2"
                  />
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="mt-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove objective"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
