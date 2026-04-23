import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, comparePassword } from '@/lib/auth';

function isDatabaseConnectivityError(err) {
  if (!err || typeof err !== 'object') return false;
  const name = String(err.name || '');
  const msg = String(err.message || '');
  return (
    name === 'MongoServerSelectionError' ||
    name === 'MongoNetworkError' ||
    msg.includes('querySrv') ||
    msg.includes('getaddrinfo') ||
    msg.includes('ECONNREFUSED')
  );
}

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
          schoolId: user.schoolId,
          profilePicture: user.profilePicture || null,
          floridaIepLogo: user.floridaIepLogo || null,
          emailVerified: user.emailVerified !== false
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    if (isDatabaseConnectivityError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Cannot reach the database (network or DNS). Check VPN/firewall or try Atlas’s non-SRV connection string.',
        },
        { status: 503 }
      );
    }
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
