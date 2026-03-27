import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';
import { hasMeaningfulIepPlan, cloneIepPlanData, MAX_IEP_VERSION_ENTRIES } from '@/lib/iepSnapshot';

export async function PUT(req, { params }) {
  try {
    const authResult = await protectRoute(req);
    if (authResult.error) {
      return authResult.response;
    }
    const user = authResult.user;

    await connectDB();
    const { id } = await params;

    const body = await req.json();
    const {
      original_ai_draft,
      user_edited_version,
      is_reviewed,
      rag_context,
      source,
      label,
      skip_snapshot,
      append_active_snapshot,
      active_snapshot_label
    } = body;

    console.log('💾 Save IEP Request Body keys:', Object.keys(body));

    const student = await Student.findOne({ _id: id, createdBy: user._id });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log('📦 Existing IEP data before save:', student.iep_plan_data);

    function pickStringFromItem(item) {
      if (typeof item === 'string') return item;
      if (item == null) return '';
      if (typeof item === 'object') {
        if (typeof item.goal === 'string') return item.goal;
        if (typeof item.title === 'string') return item.title;
        if (typeof item.text === 'string') return item.text;
        if (typeof item.objective === 'string') return item.objective;
        const parts = [];
        if (item.condition) parts.push(item.condition);
        if (item.behavior) parts.push(item.behavior);
        if (item.criteria) parts.push(item.criteria);
        if (parts.length) return parts.join(' ');
        try {
          return JSON.stringify(item);
        } catch (e) {
          return String(item);
        }
      }
      return String(item);
    }

    function normalizeGeneratedContent(content) {
      if (!content || typeof content !== 'object') return content;
      const copy = { ...content };

      if (Array.isArray(copy.annual_goals)) {
        copy.annual_goals = copy.annual_goals.map((item) => {
          if (item && typeof item === 'object' && (item.domain || item.condition || item.observable_behavior || item.progress_measurement || item.goal)) return item;
          return pickStringFromItem(item);
        });
      }
      if (Array.isArray(copy.short_term_objectives)) {
        copy.short_term_objectives = copy.short_term_objectives.map((item) => {
          if (item && typeof item === 'object' && (typeof item.aligned_goal_index === 'number' || item.condition || item.observable_behavior || item.objective)) return item;
          return pickStringFromItem(item);
        });
      }

      if (Array.isArray(copy.annualGoalsByExceptionality)) {
        copy.annualGoalsByExceptionality = copy.annualGoalsByExceptionality.map((grp) => ({
          exceptionality: grp.exceptionality,
          goals: Array.isArray(grp.goals) ? grp.goals.map((g) => ({ referenceId: g.referenceId, goal: pickStringFromItem(g.goal) })) : []
        }));
      }
      if (Array.isArray(copy.shortTermObjectivesByExceptionality)) {
        copy.shortTermObjectivesByExceptionality = copy.shortTermObjectivesByExceptionality.map((grp) => ({
          exceptionality: grp.exceptionality,
          objectives: Array.isArray(grp.objectives) ? grp.objectives.map((o) => ({
            referenceId: o.referenceId,
            alignedAnnualGoalReferenceId: o.alignedAnnualGoalReferenceId,
            objective: pickStringFromItem(o.objective)
          })) : []
        }));
      }

      if (Array.isArray(copy.recommendedAccommodations)) copy.recommendedAccommodations = copy.recommendedAccommodations.map((a) => (typeof a === 'string' ? a : String(a)));
      if (Array.isArray(copy.custom_goals)) copy.custom_goals = copy.custom_goals.map((cg) => ({
        title: cg?.title || '',
        recommendation: cg?.recommendation || '',
        retrieved_objectives: Array.isArray(cg?.retrieved_objectives) ? cg.retrieved_objectives : []
      }));

      return copy;
    }

    const normalizedOriginal = normalizeGeneratedContent(original_ai_draft) || student.iep_plan_data?.original_ai_draft || {};
    const normalizedUserEdited = normalizeGeneratedContent(user_edited_version) || {};

    // ── Milestone 3: snapshot previous IEP before overwrite ──
    if (!skip_snapshot && hasMeaningfulIepPlan(student.iep_plan_data)) {
      const prev = student.iep_plan_data;
      const nextVersion = (student.iep_version_history?.length || 0) + 1;
      student.iep_version_history.push({
        version: nextVersion,
        createdAt: new Date(),
        source: typeof source === 'string' && source ? source : 'save',
        label: typeof label === 'string' ? label : '',
        snapshot: cloneIepPlanData(prev),
        meta: {
          is_reviewed: !!prev.is_reviewed,
          last_updated: prev.last_updated || null
        }
      });
      while (student.iep_version_history.length > MAX_IEP_VERSION_ENTRIES) {
        student.iep_version_history.shift();
      }
      student.markModified('iep_version_history');
    }

    student.iep_plan_data = {
      ...(student.iep_plan_data && typeof student.iep_plan_data === 'object' ? student.iep_plan_data : {}),
      original_ai_draft: normalizedOriginal,
      user_edited_version: normalizedUserEdited,
      is_reviewed: is_reviewed,
      last_updated: new Date(),
      ...(rag_context != null && rag_context !== '' ? { rag_context } : {})
    };

    student.markModified('iep_plan_data');

    // After stream generation: record the new plan in version history (skip_snapshot avoids duplicating a pre-overwrite row).
    if (append_active_snapshot) {
      const nextVersion = (student.iep_version_history?.length || 0) + 1;
      student.iep_version_history.push({
        version: nextVersion,
        createdAt: new Date(),
        source: 'generated',
        label: typeof active_snapshot_label === 'string' ? active_snapshot_label : '',
        snapshot: cloneIepPlanData(student.iep_plan_data),
        meta: {
          is_reviewed: !!student.iep_plan_data.is_reviewed,
          last_updated: student.iep_plan_data.last_updated || null
        }
      });
      while (student.iep_version_history.length > MAX_IEP_VERSION_ENTRIES) {
        student.iep_version_history.shift();
      }
      student.markModified('iep_version_history');
    }

    await student.save();

    console.log('✅ IEP saved successfully to database');

    return NextResponse.json({
      success: true,
      message: 'IEP plan saved successfully',
      student
    });
  } catch (error) {
    console.error('Save IEP Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
