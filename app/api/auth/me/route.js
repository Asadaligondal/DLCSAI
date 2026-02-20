import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';

export async function GET(request) {
  const authResult = await protectRoute(request);
  if (authResult.error) return authResult.response;

  const user = authResult.user;
  return NextResponse.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      profilePicture: user.profilePicture || null
    }
  });
}
