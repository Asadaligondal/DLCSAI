import React, { useState } from 'react';
import { X } from 'lucide-react';
import SectionCard from './SectionCard';
import RowEditor from './RowEditor';

// Helpers to safely format goals/objectives that may be strings or objects
function formatAnnualGoal(goal) {
  if (typeof goal === 'string') return goal;
  if (!goal) return '';
  if (goal.title) return goal.title;
  if (goal.goal) return goal.goal;
  // fallback compose
  return [goal.condition, goal.behavior, goal.criteria].filter(Boolean).join(' ').trim();
}

function formatObjective(obj) {
  if (typeof obj === 'string') return obj;
  if (!obj) return '';
  if (obj.text) return obj.text;
  if (obj.objective) return obj.objective;
  return [obj.text, obj.criteria].filter(Boolean).join(' ').trim();
}

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
  const [openPlaafp, setOpenPlaafp] = useState(true);
  const [openAcademicPerformance, setOpenAcademicPerformance] = useState(true);
  const [openGrouped, setOpenGrouped] = useState(true);
  const [openGoals, setOpenGoals] = useState(true);
  const [openObjectives, setOpenObjectives] = useState(true);
  const [openRecommendedAccommodations, setOpenRecommendedAccommodations] = useState(true);
  const [openInterventions, setOpenInterventions] = useState(true);
  const [openCustomGoals, setOpenCustomGoals] = useState(true);

  return (
    <>
      {/* PLAAFP first for Original view */}
      {viewMode === 'original' && (
        <SectionCard id="plaafp-narrative" title="PLAAFP Narrative" subtitle="Read-only original AI draft" open={openPlaafp} onToggle={() => setOpenPlaafp(s => !s)}>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.plaafp_narrative}</p>
        </SectionCard>
      )}

      {/* PLAAFP + Annual Goals + Objectives (flat lists) */}
      {viewMode === 'original' ? (
        <>
          {/* Grouped Goals & Objectives by Exceptionality (second) */}
          {originalAIPlan.annualGoalsByExceptionality && originalAIPlan.annualGoalsByExceptionality.length > 0 && (
            <SectionCard id="goals-objectives-by-exceptionality" title="Goals & Objectives by Exceptionality" subtitle="Grouped by exceptionality" open={openGrouped} onToggle={() => setOpenGrouped(s => !s)}>
              <div className="space-y-3">
                {originalAIPlan.annualGoalsByExceptionality.map((group) => (
                  <SectionCard key={group.exceptionality} title={group.exceptionality} subtitle={`${group.goals?.length || 0} goals`}>
                    <div className="space-y-2">
                      {group.goals?.map((g, gi) => {
                        const parsedG = parseInt(g?.referenceId, 10);
                        const gDisplayIndex = Number.isFinite(parsedG) ? parsedG : gi;
                        return (
                          <div key={`g-${g.referenceId}-${gi}`} className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{gDisplayIndex + 1}</div>
                            <p className="text-gray-700 text-sm">{formatAnnualGoal(g)}</p>
                          </div>
                        );
                      })}

                      {originalAIPlan.shortTermObjectivesByExceptionality && originalAIPlan.shortTermObjectivesByExceptionality.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-600 mb-2">Short-Term Objectives</div>
                          <div className="space-y-2">
                            {(originalAIPlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives || []).map((o, oi) => {
                              const parsedO = parseInt(o?.referenceId, 10);
                              const oDisplayIndex = Number.isFinite(parsedO) ? parsedO : oi;
                              return (
                                <div key={`o-${o.referenceId}`} className="flex gap-3 items-start">
                                  <div className="flex-shrink-0 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{oDisplayIndex + 1}</div>
                                  <p className="text-gray-700 text-sm">{formatObjective(o)}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard id="annual-goals" title="Annual Goals" subtitle="Editable list in numbered rows" open={openGoals} onToggle={() => setOpenGoals(s => !s)}>
            <div className="space-y-2">
              {originalAIPlan.annual_goals?.map((goal, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                  <p className="text-gray-700 text-sm pt-0.5">{formatAnnualGoal(goal)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="short-term-objectives" title="Short-Term Objectives" subtitle="Editable list in numbered rows" open={openObjectives} onToggle={() => setOpenObjectives(s => !s)}>
            <div className="space-y-2">
              {originalAIPlan.short_term_objectives?.map((objective, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                  <p className="text-gray-700 text-sm pt-0.5">{formatObjective(objective)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="intervention-recommendations" title="Intervention Recommendations" subtitle="AI suggested interventions" open={openInterventions} onToggle={() => setOpenInterventions(s => !s)}>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.intervention_recommendations}</p>
          </SectionCard>

          <SectionCard id="custom-goals" title="Custom Goals (LLM Recommendations)" subtitle="Suggested custom goals" open={openCustomGoals} onToggle={() => setOpenCustomGoals(s => !s)}>
            {originalAIPlan.custom_goals && originalAIPlan.custom_goals.length > 0 ? (
              <div className="space-y-2">
                {originalAIPlan.custom_goals.map((cg, idx) => (
                  <div key={`cg-${idx}`} className="p-2 border border-gray-100 rounded">
                    <div className="text-sm font-medium text-gray-800">{cg.title}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{cg.recommendation || cg.recommendation_text || cg.description || ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="text-2xl">📭</div>
                <div>
                  <div className="font-medium text-gray-900">No custom goals yet</div>
                  <div className="text-xs text-gray-500">Add custom goals or regenerate with custom inputs.</div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Academic Performance Achievement (AI Generated) */}
          <SectionCard id="academic-performance-achievement" title="Academic Performance Achievement" subtitle="AI-generated performance indicators" open={openAcademicPerformance} onToggle={() => setOpenAcademicPerformance(s => !s)}>
            {originalAIPlan.academicPerformanceAchievement ? (
              <div className="space-y-2">
                {originalAIPlan.academicPerformanceAchievement.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 border border-blue-100 rounded text-sm text-gray-700">
                    {line.trim()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="text-2xl">📈</div>
                <div>
                  <div className="font-medium text-gray-900">No performance data yet</div>
                  <div className="text-xs text-gray-500">Generate IEP to see academic performance indicators.</div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Recommended Accommodations (AI Generated) */}
          <SectionCard id="recommended-accommodations" title="Recommended Accommodations" subtitle="AI-suggested accommodations" open={openRecommendedAccommodations} onToggle={() => setOpenRecommendedAccommodations(s => !s)}>
            {originalAIPlan.recommendedAccommodations && originalAIPlan.recommendedAccommodations.length > 0 ? (
              <div className="space-y-2">
                {originalAIPlan.recommendedAccommodations.map((accommodation, idx) => (
                  <div key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium mr-1 mb-1">
                    {accommodation}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium text-gray-900">No accommodations yet</div>
                  <div className="text-xs text-gray-500">Generate IEP to see recommended accommodations.</div>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        // Edited view: editable lists
        <>
          <SectionCard id="plaafp-narrative" title="PLAAFP Narrative" subtitle="Edit wording to match school documentation." open={openPlaafp} onToggle={() => setOpenPlaafp(s => !s)}>
            <textarea
              value={editablePlan.plaafp_narrative}
              onChange={(e) => setEditablePlan({ ...editablePlan, plaafp_narrative: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm leading-relaxed resize-none"
              rows={6}
            />
          </SectionCard>

          {/* Grouped snapshot shown above flat editable lists in the original implementation; keep same behavior */}
          { (editablePlan.annualGoalsByExceptionality && editablePlan.annualGoalsByExceptionality.length > 0) && (
            <SectionCard id="goals-objectives-by-exceptionality" title="Goals & Objectives by Exceptionality (LLM)" subtitle="Grouped editor" open={openGrouped} onToggle={() => setOpenGrouped(s => !s)}>
              <div className="space-y-3">
                {editablePlan.annualGoalsByExceptionality.map((group, gIdx) => (
                  <SectionCard
                    key={group.exceptionality}
                    title={group.exceptionality}
                    subtitle={group.goals?.length ? `${group.goals.length} goals` : ''}
                    rightUtilities={(
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded">Goals: {group.goals?.length || 0}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded">Objectives: {((editablePlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives) || []).length}</span>
                      </div>
                    )}
                  >
                    <div className="space-y-2">
                      {group.goals?.map((g, gi) => (
                        <RowEditor
                          key={`eg-${g.referenceId}`}
                          index={parseInt(g.referenceId, 10) || gi}
                          value={formatAnnualGoal(g)}
                          onChange={(val) => updateGroupedGoal(gIdx, gi, val)}
                          onDelete={null}
                        />
                      ))}

                      {editablePlan.shortTermObjectivesByExceptionality && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-600 mb-2">Short-Term Objectives</div>
                          <div className="space-y-2">
                            {(editablePlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives || []).map((o, oi) => {
                              const objGroupIndex = editablePlan.shortTermObjectivesByExceptionality.findIndex(sg => sg.exceptionality === group.exceptionality);
                              return (
                                  <RowEditor
                                    key={`eo-${objGroupIndex}-${oi}-${o.referenceId ?? oi}`}
                                    index={parseInt(o.referenceId, 10) || oi}
                                    value={formatObjective(o)}
                                    onChange={(val) => updateGroupedObjective(objGroupIndex, oi, val)}
                                    onDelete={null}
                                  />
                                );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard id="annual-goals" title="Annual Goals" subtitle="Edit goals in rows" open={openGoals} onToggle={() => setOpenGoals(s => !s)}>
            <div className="space-y-2">
                      {editablePlan.annual_goals?.map((goal, index) => (
                <RowEditor
                  key={index}
                  index={index}
                  value={formatAnnualGoal(goal)}
                  onChange={(val) => updateGoal(index, val)}
                  onDelete={() => removeGoal(index)}
                  badgeColor={'bg-slate-400'}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard id="short-term-objectives" title="Short-Term Objectives" subtitle="Edit objectives in rows" open={openObjectives} onToggle={() => setOpenObjectives(s => !s)}>
            <div className="space-y-2">
              {editablePlan.short_term_objectives?.map((objective, index) => (
                <RowEditor
                  key={index}
                  index={index}
                  value={formatObjective(objective)}
                  onChange={(val) => updateObjective(index, val)}
                  onDelete={() => removeObjective(index)}
                  badgeColor={'bg-slate-400'}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard id="custom-goals" title="Custom Goals (LLM Recommendations)" subtitle="Edit or accept suggested custom goals" open={openCustomGoals} onToggle={() => setOpenCustomGoals(s => !s)}>
            {editablePlan.custom_goals && editablePlan.custom_goals.length > 0 ? (
              <div className="space-y-2">
                {editablePlan.custom_goals.map((cg, idx) => (
                  <div key={`eg-edit-${idx}`} className="p-2 border border-gray-100 rounded">
                    <div className="text-sm font-medium text-gray-800 mb-1">{cg.title}</div>
                    <textarea
                      value={cg.recommendation || ''}
                      onChange={(e) => {
                        setEditablePlan(prev => {
                          const next = JSON.parse(JSON.stringify(prev || {}));
                          if (!Array.isArray(next.custom_goals)) next.custom_goals = [];
                          next.custom_goals[idx] = next.custom_goals[idx] || { title: cg.title, recommendation: '' };
                          next.custom_goals[idx].recommendation = e.target.value;
                          return next;
                        });
                      }}
                      rows={3}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="text-2xl">📭</div>
                <div>
                  <div className="font-medium text-gray-900">No custom goals yet</div>
                  <div className="text-xs text-gray-500">Add custom goals or regenerate with custom inputs.</div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Academic Performance Achievement (Editable) */}
          <SectionCard id="academic-performance-achievement" title="Academic Performance Achievement" subtitle="Edit performance indicators" open={openAcademicPerformance} onToggle={() => setOpenAcademicPerformance(s => !s)}>
            <textarea
              value={editablePlan.academicPerformanceAchievement || ''}
              onChange={(e) => setEditablePlan({ ...editablePlan, academicPerformanceAchievement: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm leading-relaxed resize-none"
              rows={4}
              placeholder="Edit academic performance indicators..."
            />
          </SectionCard>

          {/* Recommended Accommodations (Read-Only in Edited View) */}
          <SectionCard id="recommended-accommodations" title="Recommended Accommodations" subtitle="AI-suggested accommodations (read-only)" open={openRecommendedAccommodations} onToggle={() => setOpenRecommendedAccommodations(s => !s)}>
            {editablePlan.recommendedAccommodations && editablePlan.recommendedAccommodations.length > 0 ? (
              <div className="space-y-2">
                {editablePlan.recommendedAccommodations.map((accommodation, idx) => (
                  <div key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium mr-1 mb-1">
                    {accommodation}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium text-gray-900">No accommodations yet</div>
                  <div className="text-xs text-gray-500">Generate IEP to see recommended accommodations.</div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Editable interventions for edited view */}
          <SectionCard id="intervention-recommendations" title="Intervention Recommendations" subtitle="Edit recommended interventions" open={openInterventions} onToggle={() => setOpenInterventions(s => !s)}>
            <textarea
              value={editablePlan.intervention_recommendations}
              onChange={(e) => setEditablePlan({ ...editablePlan, intervention_recommendations: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm leading-relaxed resize-none"
              rows={4}
            />
          </SectionCard>
        </>
      )}
    </>
  );
}
