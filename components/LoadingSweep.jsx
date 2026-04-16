'use client';

/**
 * Left-to-right shine sweep for loading surfaces. Parent must be `relative overflow-hidden`
 * (and usually `rounded-*` so the sweep clips nicely).
 */
export default function LoadingSweep({ variant = 'default', className = '' }) {
  const bar =
    variant === 'emphasis'
      ? 'via-primary-300/50'
      : variant === 'onPrimary'
        ? 'via-white/35'
        : 'via-white/55';

  return (
    <span
      className={`pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[inherit] ${className}`}
      aria-hidden
    >
      <span
        className={`absolute top-0 bottom-0 left-0 w-[38%] max-w-[200px] -skew-x-[18deg] bg-gradient-to-r from-transparent ${bar} to-transparent opacity-90 animate-loading-sweep shadow-[inset_0_0_20px_rgba(255,255,255,0.15)]`}
      />
    </span>
  );
}
