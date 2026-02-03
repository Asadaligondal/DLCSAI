import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;
    const { id } = params;

    await connectDB();

    const student = await Student.findOne({ _id: id, createdBy: user._id }).select('student_accommodations');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, accommodations: student.student_accommodations || {} }, { status: 200 });
  } catch (error) {
    console.error('Get Accommodations Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while fetching accommodations', error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;
    const { id } = params;
    const body = await request.json();

    await connectDB();

    const student = await Student.findOne({ _id: id, createdBy: user._id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found or unauthorized' }, { status: 404 });
    }

    // Validate and sanitize accommodations payload
    const validateAccommodations = (input) => {
      if (!input || typeof input !== 'object') throw new Error('Payload must be an object');

      const sanitizeString = (v) => (v == null ? '' : String(v));
      const sanitizeBool = (v) => !!v;
      const sanitizeArrayOfStrings = (v) => (Array.isArray(v) ? v.map((x) => sanitizeString(x)) : []);

      const sanitizeItem = (it) => {
        if (!it || typeof it !== 'object') return null;
        return {
          id: sanitizeString(it.id),
          label: sanitizeString(it.label),
          subOptions: Array.isArray(it.subOptions) ? it.subOptions.map((s) => sanitizeString(s)) : [],
          otherText: sanitizeString(it.otherText),
          notes: sanitizeString(it.notes),
          tags: Array.isArray(it.tags) ? it.tags.map((t) => sanitizeString(t)) : []
        };
      };

      const sanitizeScope = (scopeObj) => {
        const keys = ['presentation', 'response', 'scheduling', 'setting', 'assistive_technology_device'];
        const out = {};
        keys.forEach((k) => {
          out[k] = Array.isArray(scopeObj?.[k]) ? scopeObj[k].map((it) => sanitizeItem(it)).filter(Boolean) : [];
        });
        // category-level notes may be present under e.g. presentation_notes
        keys.forEach((k) => {
          const notesKey = `${k}_notes`;
          if (typeof scopeObj?.[notesKey] === 'string') out[notesKey] = scopeObj[notesKey];
        });
        return out;
      };

      const sanitized = {
        consent: {
          parentConsentRequired: sanitizeBool(input?.consent?.parentConsentRequired),
          parentConsentObtained: sanitizeBool(input?.consent?.parentConsentObtained),
          consentNotes: sanitizeString(input?.consent?.consentNotes)
        },
        classroom: sanitizeScope(input?.classroom || {}),
        assessment: sanitizeScope(input?.assessment || {})
      };

      return sanitized;
    };

    let sanitizedPayload;
    try {
      sanitizedPayload = validateAccommodations(body);
    } catch (err) {
      return NextResponse.json({ success: false, message: `Invalid accommodations payload: ${err.message}` }, { status: 400 });
    }

    student.student_accommodations = sanitizedPayload;
    await student.save();

    return NextResponse.json({ success: true, message: 'Accommodations saved', accommodations: student.student_accommodations }, { status: 200 });
  } catch (error) {
    console.error('Save Accommodations Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while saving accommodations', error: error.message }, { status: 500 });
  }
}
