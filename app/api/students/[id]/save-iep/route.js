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
    const { ai_generated_draft, final_approved_content } = body;

    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Update the IEP plan with version history
    student.iepPlan = {
      ai_generated_draft: {
        ...ai_generated_draft,
        generated_at: new Date()
      },
      final_approved_content: {
        ...final_approved_content,
        approved_at: new Date(),
        approved_by: decoded.id
      }
    };

    await student.save();

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
