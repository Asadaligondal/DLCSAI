'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isJwtExpired, clearClientSession } from '@/lib/jwtClient';

/** Pages where we only clear a dead token, not force /login (marketing / auth forms). */
const STAY = new Set(['/', '/login', '/forgot-password', '/reset-password', '/verify-email']);

export default function SessionExpiryGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token || !isJwtExpired(token)) return;
    clearClientSession();
    if (STAY.has(pathname)) return;
    router.replace('/login');
  }, [pathname, router]);

  return null;
}
