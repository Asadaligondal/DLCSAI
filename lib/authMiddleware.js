import { NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import connectDB from './mongodb';
import User from '@/models/User';

/**
 * Middleware to protect API routes - verify JWT token
 * Usage in API routes:
 *
 * export async function GET(request) {
 *   const authResult = await protectRoute(request);
 *   if (authResult.error) {
 *     return authResult.response;
 *   }
 *   const user = authResult.user;
 *   // Your protected route logic here
 * }
 */
export async function protectRoute(request) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        error: true,
        response: NextResponse.json(
          {
            success: false,
            message: 'Not authorized, no token provided'
          },
          { status: 401 }
        )
      };
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Connect to database
      await connectDB();

      // Find user by id from token payload (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return {
          error: true,
          response: NextResponse.json(
            {
              success: false,
              message: 'Not authorized, user not found'
            },
            { status: 401 }
          )
        };
      }

      // Return user if authentication successful
      return {
        error: false,
        user: JSON.parse(JSON.stringify(user)) // Convert Mongoose doc to plain object
      };
    } catch (error) {
      return {
        error: true,
        response: NextResponse.json(
          {
            success: false,
            message: 'Not authorized, token invalid or expired'
          },
          { status: 401 }
        )
      };
    }
  } catch (error) {
    console.error('Protect Route Error:', error);
    return {
      error: true,
      response: NextResponse.json(
        {
          success: false,
          message: 'Server error in authentication',
          error: error.message
        },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if user is admin
 * Call this after protectRoute
 *
 * Usage:
 * const authResult = await protectRoute(request);
 * if (authResult.error) return authResult.response;
 *
 * const adminCheck = checkAdmin(authResult.user);
 * if (adminCheck.error) return adminCheck.response;
 */
export function checkAdmin(user) {
  if (!user || user.role !== 'admin') {
    return {
      error: true,
      response: NextResponse.json(
        {
          success: false,
          message: 'Not authorized as an admin'
        },
        { status: 403 }
      )
    };
  }

  return { error: false };
}

/**
 * Combined middleware for admin-only routes
 */
export async function protectAdminRoute(request) {
  const authResult = await protectRoute(request);
  if (authResult.error) {
    return authResult;
  }

  const adminCheck = checkAdmin(authResult.user);
  if (adminCheck.error) {
    return adminCheck;
  }

  return { error: false, user: authResult.user };
}
