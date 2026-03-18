import React, { useState, useMemo } from 'react';
import { ChevronsUpDown, CheckCircle2, Target, BarChart3, CalendarClock } from 'lucide-react';
import SectionCard from './SectionCard';
import RowEditor from './RowEditor';

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

// Fallback pattern-based domain extraction for legacy string goals
const DOMAIN_PATTERNS = [
  { pattern: /\bread(ing|iness)\b|phonem|letter.?sound|decod|word recogn|comprehension|print awareness|sight word|blends|digraph|vowel|consonant|fluency(?! of speech)|vocabulary|literature|genre|nonfiction|reference material/i, label: 'Reading', badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { pattern: /\bmath|addition|subtraction|multiplication|division|measur|problem.solv|operation|algebra|geometry|number sense|fraction|decimal|money|calculator|equation|graph|statistic|probability|counting/i, label: 'Math', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { pattern: /\bwrit(e|ing)\b|trac(e|ing)|copy|handwriting|spell|grammar|sentence|paragraph|essay|composit|pencil/i, label: 'Writing', badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  { pattern: /\bfine.?motor|gross.?motor|manipulat(e|ing)|grasp|cut|scissors|dexterity|coordination|motor skill/i, label: 'Motor', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { pattern: /\bspeech|language|communicat|articul|intelligib|phonolog|expressive|receptive|pragmatic|stutter|fluency of speech|retell|conversation/i, label: 'Communication', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { pattern: /\bvisual.?motor|visual.?track|eye.?contact|visual.?percep|visually track/i, label: 'Visual', badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  { pattern: /\bbehavio|social|interact|attention|self.?regulat|emotion|coping|impulse|peer|classroom.?skill|school.?skill|mainstream/i, label: 'Behavior', badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
];

function extractDomainFromText(text) {
  if (!text) return null;
  for (const d of DOMAIN_PATTERNS) {
    if (d.pattern.test(text)) return d;
  }
  return null;
}

function isStructuredGoal(goal) {
  return goal && typeof goal === 'object' && (goal.domain || goal.condition || goal.observable_behavior || goal.progress_measurement || goal.progress_reporting || goal.goal);
}

function isStructuredObjective(obj) {
  return obj && typeof obj === 'object' && (typeof obj.aligned_goal_index === 'number' || obj.condition || obj.observable_behavior);
}

function DomainBadge({ goal }) {
  if (isStructuredGoal(goal) && goal.domain && IEP_DOMAINS[goal.domain]) {
    const d = IEP_DOMAINS[goal.domain];
    return <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ${d.badge} whitespace-nowrap`}>{d.short}</span>;
  }
  const text = typeof goal === 'string' ? goal : (goal?.goal || goal?.objective || '');
  const domain = extractDomainFromText(text);
  if (!domain) return null;
  return <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ${domain.badge} whitespace-nowrap`}>{domain.label}</span>;
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

// Group goals by IEP domain; nest objectives under their parent goal

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
  updateObjective,
  setEditablePlan
}) {
  // Section open states — narratives + exceptionality goals open, rest collapsed
  const [openPlaafp, setOpenPlaafp] = useState(true);
  const [openAcademic, setOpenAcademic] = useState(true);
  const [openGrouped, setOpenGrouped] = useState(true);
  const [openGoalsObjectives, setOpenGoalsObjectives] = useState(true);
  const [openGoals, setOpenGoals] = useState(true);
  const [openObjectives, setOpenObjectives] = useState(true);
  const [openCustomGoals, setOpenCustomGoals] = useState(false);
  const [openAccommodations, setOpenAccommodations] = useState(false);
  const [openInterventions, setOpenInterventions] = useState(false);

  // Helpers to update grouped goals/objectives inside editablePlan
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

  // Intervention item handlers for editable row list
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

  // Pick plan by mode
  const plan = viewMode === 'edited' ? editablePlan : originalAIPlan;
  const isEditable = viewMode === 'edited';

  // Counts for summary strip
  const excGoalCount = (plan?.annualGoalsByExceptionality || []).reduce((sum, g) => sum + (g.goals?.length || 0), 0);
  const excObjCount = (plan?.shortTermObjectivesByExceptionality || []).reduce((sum, g) => sum + (g.objectives?.length || 0), 0);
  const goalCount = plan?.annual_goals?.length || 0;
  const objCount = plan?.short_term_objectives?.length || 0;
  const accCount = plan?.recommendedAccommodations?.length || 0;
  const intCount = interventionItems.length;
  const customCount = plan?.custom_goals?.length || 0;

  // Expand / collapse all
  const allSetters = [setOpenPlaafp, setOpenAcademic, setOpenGrouped, setOpenGoalsObjectives, setOpenGoals, setOpenObjectives, setOpenCustomGoals, setOpenAccommodations, setOpenInterventions];
  const allOpen = openPlaafp && openAcademic && openGrouped && openGoalsObjectives && openGoals && openObjectives && openCustomGoals && openAccommodations && openInterventions;
  const toggleAll = () => { const target = !allOpen; allSetters.forEach(s => s(target)); };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  // Structured goal card (read-only) — shows all Florida IEP fields
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* ── Summary Strip ── */}
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

      {/* ── Two-Column Narratives ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          id="plaafp-narrative"
          title="PLAAFP Narrative"
          subtitle={isEditable ? 'Edit to match school documentation' : 'Present levels of performance'}
          accent="blue"
          open={openPlaafp}
          onToggle={() => setOpenPlaafp(s => !s)}
        >
          {isEditable ? (
            <textarea
              value={editablePlan.plaafp_narrative}
              onChange={(e) => setEditablePlan({ ...editablePlan, plaafp_narrative: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] leading-relaxed resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              rows={8}
            />
          ) : (
            <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{originalAIPlan.plaafp_narrative}</p>
          )}
        </SectionCard>

        <SectionCard
          id="academic-performance-achievement"
          title="Academic Performance"
          subtitle={isEditable ? 'Edit performance indicators' : 'Current achievement levels'}
          accent="blue"
          open={openAcademic}
          onToggle={() => setOpenAcademic(s => !s)}
        >
          {isEditable ? (
            <textarea
              value={editablePlan.academicPerformanceAchievement || ''}
              onChange={(e) => setEditablePlan({ ...editablePlan, academicPerformanceAchievement: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] leading-relaxed resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              rows={8}
              placeholder="Academic performance indicators..."
            />
          ) : (
            originalAIPlan.academicPerformanceAchievement ? (
              <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{originalAIPlan.academicPerformanceAchievement}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Generate IEP to see academic performance indicators.</p>
            )
          )}
        </SectionCard>
      </div>

      {/* ── Goals & Objectives by Exceptionality ── */}
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
                          {isEditable ? (
                            <RowEditor
                              index={parseInt(g.referenceId, 10) || gi}
                              value={text}
                              onChange={(val) => updateGroupedGoal(gIdx, gi, val)}
                              onDelete={null}
                              badgeColor="bg-purple-500"
                            />
                          ) : (
                            <div className="flex gap-2 items-start py-1">
                              <div className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">G</div>
                              <p className="text-slate-700 text-[13px] leading-snug">{text}</p>
                            </div>
                          )}

                          {alignedObjs.length > 0 && (
                            <div className="ml-4 mt-0.5 mb-1.5 pl-3 border-l-2 border-purple-100 space-y-0.5">
                              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Objectives</div>
                              {alignedObjs.map((o, oi) => {
                                const oText = formatObjective(o);
                                const oIdx = matchingObjs.indexOf(o);
                                return isEditable ? (
                                  <RowEditor
                                    key={`eo-${gIdx}-${gi}-${oi}`}
                                    index={parseInt(o.referenceId, 10) || oi}
                                    value={oText}
                                    onChange={(val) => updateGroupedObjective(objGroupIndex, oIdx, val)}
                                    onDelete={null}
                                    badgeColor="bg-purple-400"
                                  />
                                ) : (
                                  <div key={`eo-${gIdx}-${gi}-${oi}`} className="flex gap-2 items-start py-0.5">
                                    <div className="flex-shrink-0 w-4 h-4 bg-purple-50 text-purple-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                                    <p className="text-slate-600 text-[13px] leading-snug">{oText}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Unlinked objectives */}
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
                            return isEditable ? (
                              <RowEditor
                                key={`euo-${gIdx}-${oi}`}
                                index={parseInt(o.referenceId, 10) || oi}
                                value={oText}
                                onChange={(val) => updateGroupedObjective(objGroupIndex, oIdx, val)}
                                onDelete={null}
                                badgeColor="bg-purple-400"
                              />
                            ) : (
                              <div key={`euo-${gIdx}-${oi}`} className="flex gap-2 items-start py-0.5">
                                <div className="flex-shrink-0 w-4 h-4 bg-purple-50 text-purple-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                                <p className="text-slate-600 text-[13px] leading-snug">{oText}</p>
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

      {/* ── Annual Goals & Objectives (Domain-grouped in read-only, flat with badges in edit) ── */}
      {isEditable ? (
        <SectionCard
          id="annual-goals"
          title="Annual Goals & Objectives"
          subtitle="Edit goals & objectives — structured Florida IEP format"
          accent="indigo"
          count={goalCount + objCount}
          open={openGoals}
          onToggle={() => setOpenGoals(s => !s)}
        >
          <div className="space-y-1">
            {editablePlan.annual_goals?.map((goal, index) => {
              const structured = isStructuredGoal(goal);
              const alignedObjs = (editablePlan.short_term_objectives || [])
                .map((o, oi) => ({ original: o, idx: oi }))
                .filter(({ original: o }) => isStructuredObjective(o) && o.aligned_goal_index === index);

              return (
                <div key={index}>
                  <RowEditor
                    index={index}
                    value={formatAnnualGoal(goal)}
                    onChange={(val) => updateGoal(index, val)}
                    onDelete={() => removeGoal(index)}
                    badgeColor="bg-indigo-500"
                  />
                  {structured && (goal.domain || goal.progress_measurement || goal.progress_reporting) && (
                    <div className="px-2 pb-1 flex items-center gap-1.5 flex-wrap ml-7">
                      {goal.domain && <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">{goal.domain}</span>}
                      {goal.progress_measurement && <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1"><BarChart3 className="w-2.5 h-2.5" />{goal.progress_measurement}</span>}
                      {goal.progress_reporting && <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1"><CalendarClock className="w-2.5 h-2.5" />{goal.progress_reporting}</span>}
                    </div>
                  )}

                  {alignedObjs.length > 0 && (
                    <div className="ml-4 mt-0.5 mb-1 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Objectives</div>
                      {alignedObjs.map(({ original: obj, idx: objIdx }) => (
                        <RowEditor
                          key={`obj-${objIdx}`}
                          index={objIdx}
                          value={formatObjective(obj)}
                          onChange={(val) => updateObjective(objIdx, val)}
                          onDelete={() => removeObjective(objIdx)}
                          badgeColor="bg-indigo-400"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unlinked objectives */}
            {(() => {
              const unlinked = (editablePlan.short_term_objectives || [])
                .map((o, i) => ({ original: o, idx: i }))
                .filter(({ original: o }) => !(isStructuredObjective(o) && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
              if (unlinked.length === 0) return null;
              return (
                <div className="ml-4 mt-0.5 pl-3 border-l-2 border-sky-100 space-y-0.5">
                  <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">Additional Objectives</div>
                  {unlinked.map(({ original: obj, idx: objIdx }) => (
                    <RowEditor
                      key={`uo-${objIdx}`}
                      index={objIdx}
                      value={formatObjective(obj)}
                      onChange={(val) => updateObjective(objIdx, val)}
                      onDelete={() => removeObjective(objIdx)}
                      badgeColor="bg-sky-500"
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </SectionCard>
      ) : (
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
                const alignedObjs = (plan.short_term_objectives || [])
                  .filter(o => isStructuredObjective(o) && o.aligned_goal_index === index);
                const goalObj = typeof goal === 'string' ? { goal, alignedObjectives: alignedObjs } : { ...goal, alignedObjectives: alignedObjs };
                return renderGoalCard(goalObj, index);
              })}

              {/* Unlinked objectives */}
              {(() => {
                const unlinked = (plan.short_term_objectives || [])
                  .filter(o => !(isStructuredObjective(o) && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
                if (unlinked.length === 0) return null;
                return (
                  <div className="ml-4 mt-0.5 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Additional Objectives</div>
                    {unlinked.map((o, oi) => (
                      <div key={`uo-${oi}`} className="flex gap-2 items-start py-0.5">
                        <div className="flex-shrink-0 w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                        <p className="text-slate-600 text-[13px] leading-snug">{formatObjective(o)}</p>
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
      )}

      {/* ── Custom Goals ── */}
      <SectionCard
        id="custom-goals"
        title="Custom Goals"
        subtitle={isEditable ? 'Edit recommendations & objectives' : 'LLM recommendations with retrieved objectives'}
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
                  <textarea
                    value={cg.recommendation || ''}
                    onChange={(e) => {
                      setEditablePlan(prev => {
                        const next = JSON.parse(JSON.stringify(prev || {}));
                        if (!Array.isArray(next.custom_goals)) next.custom_goals = [];
                        next.custom_goals[idx] = next.custom_goals[idx] || { title: cg.title, recommendation: '', retrieved_objectives: [] };
                        next.custom_goals[idx].recommendation = e.target.value;
                        return next;
                      });
                    }}
                    rows={2}
                    className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-[13px] leading-relaxed focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                ) : (
                  (cg.recommendation || cg.recommendation_text || cg.description) && (
                    <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{cg.recommendation || cg.recommendation_text || cg.description}</p>
                  )
                )}
                {Array.isArray(cg.retrieved_objectives) && cg.retrieved_objectives.length > 0 && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-violet-100">
                    <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Retrieved Objectives</div>
                    {cg.retrieved_objectives.map((obj, oi) => (
                      <div key={oi} className="flex gap-2 items-start py-0.5">
                        <div className="flex-shrink-0 w-4 h-4 bg-violet-50 text-violet-600 rounded flex items-center justify-center text-[9px] font-bold mt-0.5">{oi + 1}</div>
                        <p className="text-slate-600 text-[13px] leading-relaxed">{obj}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No custom goals yet. Add them from student profile and regenerate.</p>
        )}
      </SectionCard>

      {/* ── Recommended Accommodations (vertical list with checkmarks) ── */}
      <SectionCard
        id="recommended-accommodations"
        title="Recommended Accommodations"
        subtitle={isEditable ? 'AI-suggested (read-only)' : 'Generated accommodations'}
        accent="emerald"
        count={accCount}
        open={openAccommodations}
        onToggle={() => setOpenAccommodations(s => !s)}
      >
        {plan.recommendedAccommodations && plan.recommendedAccommodations.length > 0 ? (
          <div className="space-y-1.5">
            {plan.recommendedAccommodations.map((acc, idx) => (
              <div key={idx} className="flex gap-3 items-start py-1.5 px-3 rounded-lg hover:bg-emerald-50/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-700 text-[14px] leading-relaxed">{acc}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No accommodations generated yet.</p>
        )}
      </SectionCard>

      {/* ── Intervention Recommendations (editable row list) ── */}
      <SectionCard
        id="intervention-recommendations"
        title="Intervention Recommendations"
        subtitle={isEditable ? 'Edit individual interventions' : 'Evidence-based strategies'}
        accent="amber"
        count={intCount}
        open={openInterventions}
        onToggle={() => setOpenInterventions(s => !s)}
      >
        {interventionItems.length > 0 ? (
          <div className="space-y-1">
            {interventionItems.map((item, idx) =>
              isEditable ? (
                <RowEditor
                  key={idx}
                  index={idx}
                  value={item}
                  onChange={(val) => updateIntervention(idx, val)}
                  onDelete={() => removeIntervention(idx)}
                  badgeColor="bg-amber-500"
                />
              ) : (
                <div key={idx} className="flex gap-3 items-start py-1.5 px-3 rounded-lg hover:bg-amber-50/50 transition-colors">
                  <div className="flex-shrink-0 w-5 h-5 bg-amber-100 text-amber-700 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</div>
                  <p className="text-slate-700 text-[14px] leading-relaxed">{item}</p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-2">No interventions generated yet.</p>
        )}
      </SectionCard>
    </>
  );
}
