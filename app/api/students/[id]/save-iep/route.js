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

    // Update the IEP plan data
    student.iep_plan_data = {
      original_ai_draft: original_ai_draft || student.iep_plan_data?.original_ai_draft,
      user_edited_version: user_edited_version,
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
