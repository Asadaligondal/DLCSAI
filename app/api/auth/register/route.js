import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, schoolId } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide name, email, and password'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists'
        },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plainPassword: password, // Store plain text password for admin view
      role: role || 'professor',
      schoolId
    });

    // Generate JWT token
    const token = generateToken(
      { id: user._id, email: user.email, role: user.role },
      '7d'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          plainPassword: password
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error during registration',
        error: error.message
      },
      { status: 500 }
    );
  }
}
