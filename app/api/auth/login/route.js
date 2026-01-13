import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, comparePassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide email and password'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(
      { id: user._id, email: user.email, role: user.role },
      '7d'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error during login',
        error: error.message
      },
      { status: 500 }
    );
  }
}
