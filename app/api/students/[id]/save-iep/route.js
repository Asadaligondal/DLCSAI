import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import jwt from 'jsonwebtoken';

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'No authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const body = await req.json();
    const { original_ai_draft, user_edited_version, is_reviewed } = body;

    console.log('💾 Save IEP Request Body:', body);
    console.log('📝 Original AI Draft keys:', original_ai_draft ? Object.keys(original_ai_draft) : 'null');
    console.log('✏️ User Edited Version keys:', user_edited_version ? Object.keys(user_edited_version) : 'null');

    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('📦 Existing IEP data before save:', student.iep_plan_data);

    // Normalize AI-generated and user-edited IEP structures so fields that
    // are expected to be arrays of strings (per Mongoose schema) contain strings.
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

      // Top-level arrays
      if (Array.isArray(copy.annual_goals)) {
        copy.annual_goals = copy.annual_goals.map(pickStringFromItem);
      }
      if (Array.isArray(copy.short_term_objectives)) {
        copy.short_term_objectives = copy.short_term_objectives.map(pickStringFromItem);
      }

      // Grouped structures may contain nested objects; ensure inner strings
      if (Array.isArray(copy.annualGoalsByExceptionality)) {
        copy.annualGoalsByExceptionality = copy.annualGoalsByExceptionality.map((grp) => ({
          exceptionality: grp.exceptionality,
          goals: Array.isArray(grp.goals)
            ? grp.goals.map((g) => ({
                referenceId: g.referenceId,
                goal: pickStringFromItem(g.goal)
              }))
            : []
        }));
      }

      if (Array.isArray(copy.shortTermObjectivesByExceptionality)) {
        copy.shortTermObjectivesByExceptionality = copy.shortTermObjectivesByExceptionality.map((grp) => ({
          exceptionality: grp.exceptionality,
          objectives: Array.isArray(grp.objectives)
            ? grp.objectives.map((o) => ({
                referenceId: o.referenceId,
                alignedAnnualGoalReferenceId: o.alignedAnnualGoalReferenceId,
                objective: pickStringFromItem(o.objective)
              }))
            : []
        }));
      }

      return copy;
    }

    const normalizedOriginal = normalizeGeneratedContent(original_ai_draft) || student.iep_plan_data?.original_ai_draft || {};
    const normalizedUserEdited = normalizeGeneratedContent(user_edited_version) || {};

    // Update the IEP plan data (with normalized contents)
    student.iep_plan_data = {
      original_ai_draft: normalizedOriginal,
      user_edited_version: normalizedUserEdited,
      is_reviewed: is_reviewed,
      last_updated: new Date()
    };

    console.log('📦 New IEP data to save:', student.iep_plan_data);

    await student.save();
    
    console.log('✅ IEP saved successfully to database');
    console.log('📦 Saved student IEP data:', student.iep_plan_data);

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
