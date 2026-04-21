import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronsUpDown, CheckCircle2, BarChart3, CalendarClock, X } from 'lucide-react';
import SectionCard from './SectionCard';

// ---------------------------------------------------------------------------
// Florida IEP domain definitions
// ---------------------------------------------------------------------------
const IEP_DOMAINS = {
  'Curriculum and Learning Environment': { badge: 'bg-blue-50 text-blue-700 ring-blue-200', short: 'Curriculum' },
  'Social or Emotional Behavior': { badge: 'bg-orange-50 text-orange-700 ring-orange-200', short: 'Social/Emotional' },
  'Independent Functioning': { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', short: 'Independent' },
  'Communication': { badge: 'bg-rose-50 text-rose-700 ring-rose-200', short: 'Communication' },
  'Health Care': { badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200', short: 'Health Care' },
};

function isStructuredGoal(goal) {
  return goal && typeof goal === 'object' && (goal.domain || goal.condition || goal.observable_behavior || goal.progress_measurement || goal.progress_reporting || goal.goal);
}

function isStructuredObjective(obj) {
  return obj && typeof obj === 'object' && (typeof obj.aligned_goal_index === 'number' || obj.condition || obj.observable_behavior);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatAnnualGoal(goal) {
  if (typeof goal === 'string') return goal;
  if (!goal) return '';
  return goal.goal || goal.title || [goal.condition, goal.observable_behavior, goal.mastery_criteria].filter(Boolean).join(' ').trim();
}

function formatObjective(obj) {
  if (typeof obj === 'string') return obj;
  if (!obj) return '';
  return obj.objective || obj.text || [obj.condition, obj.observable_behavior, obj.mastery_criteria].filter(Boolean).join(' ').trim();
}

function splitInterventions(text) {
  if (!text) return [];
  return text.split('\n').map(s => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);
}

function joinInterventions(arr) {
  return arr.filter(Boolean).map(s => `• ${s}`).join('\n');
}

/** Whole-row hover for editable goal/objective rows (badge + text + actions). */
const ROW_HOVER = {
  indigo: 'rounded-lg px-1.5 py-1 -mx-1.5 -my-0.5 transition-colors hover:bg-indigo-50/55',
  purple: 'rounded-lg px-1.5 py-1 -mx-1.5 -my-0.5 transition-colors hover:bg-purple-50/50',
  violet: 'rounded-lg px-1.5 py-1 -mx-1.5 -my-0.5 transition-colors hover:bg-violet-50/45',
  blue: 'rounded-lg p-2 -m-2 transition-colors hover:bg-blue-50/45',
};

/** Textarea that sizes like body text (matches read-only `<p>` layout). */
function GoalTextarea({ value, onChange, className = '', wrapperClassName = '', readOnly }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || readOnly) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(480, el.scrollHeight)}px`;
  }, [value, readOnly]);
  const ta = (
    <textarea
      ref={ref}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      rows={1}
      className={`block w-full bg-transparent border-0 p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden ${readOnly ? '' : 'placeholder:text-slate-400'} ${className}`}
    />
  );
  if (readOnly) return ta;
  return (
    <div
      className={`rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors cursor-text focus-within:bg-white/80 focus-within:ring-1 focus-within:ring-slate-200/70 ${wrapperClassName}`}
    >
      {ta}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function GoalsObjectivesSection({
  originalAIPlan,
  editablePlan,
  viewMode,
  removeGoal,
  removeObjective,
  updateGoal,
  updateGoalPartial,
  updateObjective,
  setEditablePlan,
  readOnly = false,
}) {
  const [openPlaafp, setOpenPlaafp] = useState(true);
  const [openAcademic, setOpenAcademic] = useState(true);
  const [openGrouped, setOpenGrouped] = useState(true);
  const [openGoalsObjectives, setOpenGoalsObjectives] = useState(true);
  const [openObjectives, setOpenObjectives] = useState(true);
  const [openCustomGoals, setOpenCustomGoals] = useState(false);
  const [openAccommodations, setOpenAccommodations] = useState(false);
  const [openInterventions, setOpenInterventions] = useState(false);

  const updateGroupedGoal = (groupIdx, goalIdx, value) => {
    setEditablePlan(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      if (!next.annualGoalsByExceptionality?.[groupIdx]?.goals) return prev;
      next.annualGoalsByExceptionality[groupIdx].goals[goalIdx].goal = value;
      return next;
    });
  };

  const updateGroupedObjective = (groupIdx, objIdx, value) => {
    setEditablePlan(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      if (!next.shortTermObjectivesByExceptionality?.[groupIdx]?.objectives) return prev;
      next.shortTermObjectivesByExceptionality[groupIdx].objectives[objIdx].objective = value;
      return next;
    });
  };

  const interventionItems = useMemo(() => splitInterventions(
    viewMode === 'edited' ? editablePlan?.intervention_recommendations : originalAIPlan?.intervention_recommendations
  ), [viewMode === 'edited' ? editablePlan?.intervention_recommendations : originalAIPlan?.intervention_recommendations]);

  const updateIntervention = (index, value) => {
    const items = [...interventionItems];
    items[index] = value;
    setEditablePlan(prev => ({ ...prev, intervention_recommendations: joinInterventions(items) }));
  };

  const removeIntervention = (index) => {
    const items = interventionItems.filter((_, i) => i !== index);
    setEditablePlan(prev => ({ ...prev, intervention_recommendations: joinInterventions(items) }));
  };

  const updateAccommodation = (idx, value) => {
    setEditablePlan(prev => {
      const next = [...(prev?.recommendedAccommodations || [])];
      next[idx] = value;
      return { ...prev, recommendedAccommodations: next };
    });
  };

  const removeAccommodation = (idx) => {
    setEditablePlan(prev => ({
      ...prev,
      recommendedAccommodations: (prev?.recommendedAccommodations || []).filter((_, i) => i !== idx)
    }));
  };

  const plan = viewMode === 'edited' ? editablePlan : originalAIPlan;
  const isEditable = viewMode === 'edited' && !readOnly;

  const excGoalCount = (plan?.annualGoalsByExceptionality || []).reduce((sum, g) => sum + (g.goals?.length || 0), 0);
  const excObjCount = (plan?.shortTermObjectivesByExceptionality || []).reduce((sum, g) => sum + (g.objectives?.length || 0), 0);
  const goalCount = plan?.annual_goals?.length || 0;
  const objCount = plan?.short_term_objectives?.length || 0;
  const accCount = plan?.recommendedAccommodations?.length || 0;
  const intCount = interventionItems.length;
  const customCount = plan?.custom_goals?.length || 0;

  const allSetters = [setOpenPlaafp, setOpenAcademic, setOpenGrouped, setOpenGoalsObjectives, setOpenObjectives, setOpenCustomGoals, setOpenAccommodations, setOpenInterventions];
  const allOpen = openPlaafp && openAcademic && openGrouped && openGoalsObjectives && openObjectives && openCustomGoals && openAccommodations && openInterventions;
  const toggleAll = () => { const target = !allOpen; allSetters.forEach(s => s(target)); };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderGoalCard = (goal, index) => {
    const structured = isStructuredGoal(goal);
    const text = formatAnnualGoal(goal);
    return (
      <div key={`goal-${index}`}>
        <div className="flex gap-2 items-start py-1">
          <div className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">G</div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-700 text-[13px] leading-snug">{text}</p>
            {structured && (goal.domain || goal.progress_measurement || goal.progress_reporting) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {goal.domain && <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">{goal.domain}</span>}
                {goal.progress_measurement && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    <BarChart3 className="w-2.5 h-2.5" />{goal.progress_measurement}
                  </span>
                )}
                {goal.progress_reporting && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    <CalendarClock className="w-2.5 h-2.5" />{goal.progress_reporting}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {goal.alignedObjectives && goal.alignedObjectives.length > 0 && (
          <div className="ml-4 mt-0.5 mb-1.5 pl-3 border-l-2 border-indigo-100 space-y-0.5">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Objectives</div>
            {goal.alignedObjectives.map((obj, oi) => (
              <div key={`obj-${oi}`} className="flex gap-2 items-start py-0.5">
                <div className="flex-shrink-0 w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                <p className="text-slate-600 text-[13px] leading-snug">{formatObjective(obj)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGoalCardEditable = (goal, index, alignedWithIdx) => {
    const structured = isStructuredGoal(goal);
    const text = formatAnnualGoal(goal);
    return (
      <div key={`goal-ed-${index}`}>
        <div className={`flex gap-2 items-start py-1 group/goal ${ROW_HOVER.indigo}`}>
          <div className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">G</div>
          <div className="flex-1 min-w-0">
            <GoalTextarea
              value={text}
              onChange={(val) => updateGoal(index, val)}
              className="text-slate-700 text-[13px] leading-snug"
            />
            {structured && (goal.domain || goal.progress_measurement || goal.progress_reporting || isEditable) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <select
                  value={goal.domain && IEP_DOMAINS[goal.domain] ? goal.domain : ''}
                  onChange={(e) => updateGoalPartial(index, { domain: e.target.value || undefined })}
                  className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 max-w-[min(100%,220px)] cursor-pointer transition-colors hover:bg-indigo-100/90 hover:ring-indigo-300/80"
                >
                  <option value="">Domain…</option>
                  {Object.keys(IEP_DOMAINS).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200/80 cursor-text">
                  <BarChart3 className="w-2.5 h-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={goal.progress_measurement || ''}
                    onChange={(e) => updateGoalPartial(index, { progress_measurement: e.target.value })}
                    placeholder="Measurement"
                    className="bg-transparent border-0 p-0 min-w-[4rem] max-w-[180px] text-[9.5px] font-medium focus:ring-0 focus:outline-none cursor-text"
                  />
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200/80 cursor-text">
                  <CalendarClock className="w-2.5 h-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={goal.progress_reporting || ''}
                    onChange={(e) => updateGoalPartial(index, { progress_reporting: e.target.value })}
                    placeholder="Reporting"
                    className="bg-transparent border-0 p-0 min-w-[4rem] max-w-[180px] text-[9.5px] font-medium focus:ring-0 focus:outline-none cursor-text"
                  />
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeGoal(index)}
            className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/goal:opacity-100 transition-opacity flex-shrink-0"
            title="Remove goal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {alignedWithIdx.length > 0 && (
          <div className="ml-4 mt-0.5 mb-1.5 pl-3 border-l-2 border-indigo-100 space-y-0.5">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Objectives</div>
            {alignedWithIdx.map(({ original: obj, idx: objIdx }, oi) => (
              <div key={`obj-${objIdx}`} className={`flex gap-2 items-start py-0.5 group/obj ${ROW_HOVER.indigo}`}>
                <div className="flex-shrink-0 w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                <GoalTextarea
                  value={formatObjective(obj)}
                  onChange={(val) => updateObjective(objIdx, val)}
                  wrapperClassName="flex-1 min-w-0"
                  className="text-slate-600 text-[13px] leading-snug"
                />
                <button
                  type="button"
                  onClick={() => removeObjective(objIdx)}
                  className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/obj:opacity-100 transition-opacity flex-shrink-0"
                  title="Remove objective"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: excGoalCount + goalCount, label: 'Goals', color: 'text-indigo-700 bg-indigo-50' },
            { n: excObjCount + objCount, label: 'Objectives', color: 'text-sky-700 bg-sky-50' },
            { n: accCount, label: 'Accommodations', color: 'text-emerald-700 bg-emerald-50' },
            { n: intCount, label: 'Interventions', color: 'text-amber-700 bg-amber-50' },
            { n: customCount, label: 'Custom', color: 'text-violet-700 bg-violet-50' },
          ].map(({ n, label, color }) => (
            <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${color}`}>
              <span className="text-sm font-bold">{n}</span>
              <span className="text-[11px] font-medium opacity-80">{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          {allOpen ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          id="plaafp-narrative"
          title="PLAAFP Narrative"
          subtitle="Present levels of performance"
          accent="blue"
          open={openPlaafp}
          onToggle={() => setOpenPlaafp(s => !s)}
        >
          {isEditable ? (
            <div className={ROW_HOVER.blue}>
              <GoalTextarea
                value={editablePlan.plaafp_narrative || ''}
                onChange={(val) => setEditablePlan({ ...editablePlan, plaafp_narrative: val })}
                className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap min-h-[8rem]"
              />
            </div>
          ) : (
            <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{plan?.plaafp_narrative}</p>
          )}
        </SectionCard>

        <SectionCard
          id="academic-performance-achievement"
          title="Academic Performance"
          subtitle="Current achievement levels"
          accent="blue"
          open={openAcademic}
          onToggle={() => setOpenAcademic(s => !s)}
        >
          {isEditable ? (
            <div className={ROW_HOVER.blue}>
              <GoalTextarea
                value={editablePlan.academicPerformanceAchievement || ''}
                onChange={(val) => setEditablePlan({ ...editablePlan, academicPerformanceAchievement: val })}
                className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap min-h-[8rem]"
                placeholder="Academic performance indicators..."
              />
            </div>
          ) : (
            plan?.academicPerformanceAchievement ? (
              <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{plan.academicPerformanceAchievement}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Generate IEP to see academic performance indicators.</p>
            )
          )}
        </SectionCard>
      </div>

      {plan.annualGoalsByExceptionality && plan.annualGoalsByExceptionality.length > 0 && (
        <SectionCard
          id="goals-objectives-by-exceptionality"
          title="Goals by Exceptionality"
          subtitle="Disability-specific goals & objectives"
          accent="purple"
          count={excGoalCount}
          open={openGrouped}
          onToggle={() => setOpenGrouped(s => !s)}
        >
          <div className="space-y-3">
            {plan.annualGoalsByExceptionality.map((group, gIdx) => {
              const matchingObjs = (plan.shortTermObjectivesByExceptionality || [])
                .find(sg => sg.exceptionality === group.exceptionality)?.objectives || [];
              return (
                <SectionCard
                  key={group.exceptionality}
                  title={group.exceptionality}
                  accent="purple"
                  nested
                  rightUtilities={
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">{group.goals?.length || 0}G</span>
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">{matchingObjs.length}O</span>
                    </div>
                  }
                >
                  <div className="space-y-0.5">
                    {group.goals?.map((g, gi) => {
                      const text = formatAnnualGoal(g);
                      const goalRef = g.referenceId;
                      const alignedObjs = matchingObjs.filter(o => o.alignedAnnualGoalReferenceId && o.alignedAnnualGoalReferenceId === goalRef);
                      const objGroupIndex = (plan.shortTermObjectivesByExceptionality || []).findIndex(sg => sg.exceptionality === group.exceptionality);

                      return (
                        <div key={`eg-${gIdx}-${gi}`}>
                          <div className={`flex gap-2 items-start py-1 ${isEditable ? ROW_HOVER.purple : ''}`}>
                            <div className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">G</div>
                            {isEditable ? (
                              <GoalTextarea
                                value={text}
                                onChange={(val) => updateGroupedGoal(gIdx, gi, val)}
                                wrapperClassName="flex-1 min-w-0"
                                className="text-slate-700 text-[13px] leading-snug"
                              />
                            ) : (
                              <p className="text-slate-700 text-[13px] leading-snug">{text}</p>
                            )}
                          </div>

                          {alignedObjs.length > 0 && (
                            <div className="ml-4 mt-0.5 mb-1.5 pl-3 border-l-2 border-purple-100 space-y-0.5">
                              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Objectives</div>
                              {alignedObjs.map((o, oi) => {
                                const oText = formatObjective(o);
                                const oIdx = matchingObjs.indexOf(o);
                                return (
                                  <div key={`eo-${gIdx}-${gi}-${oi}`} className={`flex gap-2 items-start py-0.5 group/exo ${isEditable ? ROW_HOVER.purple : ''}`}>
                                    <div className="flex-shrink-0 w-4 h-4 bg-purple-50 text-purple-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                                    {isEditable ? (
                                      <GoalTextarea
                                        value={oText}
                                        onChange={(val) => updateGroupedObjective(objGroupIndex, oIdx, val)}
                                        wrapperClassName="flex-1 min-w-0"
                                        className="text-slate-600 text-[13px] leading-snug"
                                      />
                                    ) : (
                                      <p className="text-slate-600 text-[13px] leading-snug">{oText}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(() => {
                      const linkedRefs = new Set((group.goals || []).map(g => g.referenceId).filter(Boolean));
                      const unlinked = matchingObjs.filter(o => !o.alignedAnnualGoalReferenceId || !linkedRefs.has(o.alignedAnnualGoalReferenceId));
                      if (unlinked.length === 0) return null;
                      const objGroupIndex = (plan.shortTermObjectivesByExceptionality || []).findIndex(sg => sg.exceptionality === group.exceptionality);
                      return (
                        <div className="ml-4 mt-0.5 mb-1 pl-3 border-l-2 border-purple-100 space-y-0.5">
                          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Additional Objectives</div>
                          {unlinked.map((o, oi) => {
                            const oText = formatObjective(o);
                            const oIdx = matchingObjs.indexOf(o);
                            return (
                              <div key={`euo-${gIdx}-${oi}`} className={`flex gap-2 items-start py-0.5 group/exu ${isEditable ? ROW_HOVER.purple : ''}`}>
                                <div className="flex-shrink-0 w-4 h-4 bg-purple-50 text-purple-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                                {isEditable ? (
                                  <GoalTextarea
                                    value={oText}
                                    onChange={(val) => updateGroupedObjective(objGroupIndex, oIdx, val)}
                                    wrapperClassName="flex-1 min-w-0"
                                    className="text-slate-600 text-[13px] leading-snug"
                                  />
                                ) : (
                                  <p className="text-slate-600 text-[13px] leading-snug">{oText}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard
        id="annual-goals"
        title="Annual Goals & Objectives"
        subtitle="Structured by IEP domain"
        accent="indigo"
        count={goalCount + objCount}
        open={openGoalsObjectives}
        onToggle={() => setOpenGoalsObjectives(s => !s)}
      >
        {plan.annual_goals && plan.annual_goals.length > 0 ? (
          <div className="space-y-1">
            {plan.annual_goals.map((goal, index) => {
              const alignedWithIdx = (plan.short_term_objectives || [])
                .map((o, oi) => ({ original: o, idx: oi }))
                .filter(({ original: o }) => isStructuredObjective(o) && o.aligned_goal_index === index);
              const alignedObjs = alignedWithIdx.map(x => x.original);
              const goalObj = typeof goal === 'string' ? { goal, alignedObjectives: alignedObjs } : { ...goal, alignedObjectives: alignedObjs };
              if (isEditable) {
                return renderGoalCardEditable(goal, index, alignedWithIdx);
              }
              return renderGoalCard(goalObj, index);
            })}

            {(() => {
              const unlinked = (plan.short_term_objectives || [])
                .map((o, i) => ({ original: o, idx: i }))
                .filter(({ original: o }) => !(isStructuredObjective(o) && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
              if (unlinked.length === 0) return null;
              return (
                <div className="ml-4 mt-0.5 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Additional Objectives</div>
                  {unlinked.map(({ original: o, idx: objIdx }, oi) => (
                    <div key={`uo-${objIdx}`} className={`flex gap-2 items-start py-0.5 group/uo ${isEditable ? ROW_HOVER.indigo : ''}`}>
                      <div className="flex-shrink-0 w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                      {isEditable ? (
                        <>
                          <GoalTextarea
                            value={formatObjective(o)}
                            onChange={(val) => updateObjective(objIdx, val)}
                            wrapperClassName="flex-1 min-w-0"
                            className="text-slate-600 text-[13px] leading-snug"
                          />
                          <button
                            type="button"
                            onClick={() => removeObjective(objIdx)}
                            className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/uo:opacity-100 transition-opacity flex-shrink-0"
                            title="Remove objective"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-600 text-[13px] leading-snug">{formatObjective(o)}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No goals generated yet.</p>
        )}
      </SectionCard>

      <SectionCard
        id="custom-goals"
        title="Custom Goals"
        subtitle="LLM recommendations with retrieved objectives"
        accent="violet"
        count={customCount}
        open={openCustomGoals}
        onToggle={() => setOpenCustomGoals(s => !s)}
      >
        {plan.custom_goals && plan.custom_goals.length > 0 ? (
          <div className="space-y-3">
            {plan.custom_goals.map((cg, idx) => (
              <div key={idx} className="p-3 border border-violet-100 rounded-lg bg-violet-50/20">
                <div className="text-sm font-semibold text-slate-800">{cg.title}</div>
                {isEditable ? (
                  <div className={`mt-1.5 ${ROW_HOVER.violet}`}>
                    <GoalTextarea
                      value={cg.recommendation || ''}
                      onChange={(val) => {
                        setEditablePlan(prev => {
                          const next = JSON.parse(JSON.stringify(prev || {}));
                          if (!Array.isArray(next.custom_goals)) next.custom_goals = [];
                          next.custom_goals[idx] = next.custom_goals[idx] || { title: cg.title, recommendation: '', retrieved_objectives: [] };
                          next.custom_goals[idx].recommendation = val;
                          return next;
                        });
                      }}
                      className="text-[13px] text-slate-600 leading-relaxed w-full"
                    />
                  </div>
                ) : (
                  (cg.recommendation || cg.recommendation_text || cg.description) && (
                    <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{cg.recommendation || cg.recommendation_text || cg.description}</p>
                  )
                )}
                {Array.isArray(cg.retrieved_objectives) && cg.retrieved_objectives.length > 0 && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-violet-100">
                    <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Retrieved Objectives</div>
                    {cg.retrieved_objectives.map((obj, oi) => (
                      <div key={oi} className={`flex gap-2 items-start py-0.5 group/ro ${isEditable ? ROW_HOVER.violet : ''}`}>
                        <div className="flex-shrink-0 w-4 h-4 bg-violet-50 text-violet-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                        {isEditable ? (
                          <GoalTextarea
                            value={typeof obj === 'string' ? obj : String(obj)}
                            onChange={(val) => {
                              setEditablePlan(prev => {
                                const next = JSON.parse(JSON.stringify(prev || {}));
                                if (!Array.isArray(next.custom_goals)) return prev;
                                if (!next.custom_goals[idx]) return prev;
                                if (!Array.isArray(next.custom_goals[idx].retrieved_objectives)) next.custom_goals[idx].retrieved_objectives = [];
                                next.custom_goals[idx].retrieved_objectives[oi] = val;
                                return next;
                              });
                            }}
                            wrapperClassName="flex-1 min-w-0"
                            className="text-slate-600 text-[13px] leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-600 text-[13px] leading-relaxed">{obj}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No custom goals yet. Add them from Student context on the IEP plan page and regenerate.</p>
        )}
      </SectionCard>

      <SectionCard
        id="recommended-accommodations"
        title="Recommended Accommodations"
        subtitle="Generated accommodations"
        accent="emerald"
        count={accCount}
        open={openAccommodations}
        onToggle={() => setOpenAccommodations(s => !s)}
      >
        {plan.recommendedAccommodations && plan.recommendedAccommodations.length > 0 ? (
          <div className="space-y-1.5">
            {plan.recommendedAccommodations.map((acc, idx) => (
              <div key={idx} className="flex gap-3 items-start py-1.5 px-3 rounded-lg transition-colors hover:bg-emerald-50/70 group/acc">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                {isEditable ? (
                  <>
                    <GoalTextarea
                      value={acc}
                      onChange={(val) => updateAccommodation(idx, val)}
                      wrapperClassName="flex-1 min-w-0"
                      className="text-slate-700 text-[14px] leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => removeAccommodation(idx)}
                      className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/acc:opacity-100 transition-opacity flex-shrink-0"
                      title="Remove accommodation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <p className="text-slate-700 text-[14px] leading-relaxed">{acc}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No accommodations generated yet.</p>
        )}
      </SectionCard>

      <SectionCard
        id="intervention-recommendations"
        title="Intervention Recommendations"
        subtitle="Evidence-based strategies"
        accent="amber"
        count={intCount}
        open={openInterventions}
        onToggle={() => setOpenInterventions(s => !s)}
      >
        {interventionItems.length > 0 ? (
          <div className="space-y-1">
            {interventionItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start py-1.5 px-3 rounded-lg transition-colors hover:bg-amber-50/70 group/int">
                <div className="flex-shrink-0 w-5 h-5 bg-amber-100 text-amber-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</div>
                {isEditable ? (
                  <>
                    <GoalTextarea
                      value={item}
                      onChange={(val) => updateIntervention(idx, val)}
                      wrapperClassName="flex-1 min-w-0"
                      className="text-slate-700 text-[14px] leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => removeIntervention(idx)}
                      className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/int:opacity-100 transition-opacity flex-shrink-0"
                      title="Remove intervention"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <p className="text-slate-700 text-[14px] leading-relaxed">{item}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No interventions generated yet.</p>
        )}
      </SectionCard>
    </>
  );
}
