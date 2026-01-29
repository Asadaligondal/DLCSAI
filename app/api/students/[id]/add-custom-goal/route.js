import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Goal from '@/models/Goal';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';

export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;

    await connectDB();

    const body = await request.json();

    const { title, description, category, targetDisabilities, targetWeaknesses, requiredStrengths, gradeLevel, priority, isActive } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Title and description are required' }, { status: 400 });
    }

    // Create goal
    const goal = await Goal.create({
      title,
      description,
      category: category || 'academic',
      targetDisabilities: targetDisabilities || [],
      targetWeaknesses: targetWeaknesses || [],
      requiredStrengths: requiredStrengths || [],
      gradeLevel: gradeLevel || '',
      priority: priority || 'medium',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user._id
    });

    // Extract student id from URL
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // expected parts: ['api','students','{id}','add-custom-goal']
    const idx = parts.indexOf('students');
    const studentId = idx !== -1 && parts.length > idx + 1 ? parts[idx + 1] : null;

    if (studentId) {
      const student = await Student.findById(studentId);
      if (student) {
        student.assignedGoals = student.assignedGoals || [];
        student.assignedGoals.push(goal._id);
        await student.save();
      }
    }

    return NextResponse.json({ success: true, goal }, { status: 201 });
  } catch (error) {
    console.error('Add custom goal error', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
