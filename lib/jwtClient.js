/**
 * Client-only JWT helpers (no verification — reading `exp` for UX routing).
 */

export function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true;
  const parts = token.split('.');
  if (parts.length !== 3) return true;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    const payload = JSON.parse(json);
    if (payload.exp == null) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + 5;
  } catch {
    return true;
  }
}

export function clearClientSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    /* ignore */
  }
}
