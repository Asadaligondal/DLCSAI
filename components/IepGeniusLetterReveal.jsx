'use client';

import { useEffect, useMemo, useState } from 'react';
import LoadingSweep from '@/components/LoadingSweep';

const DEFAULT_TEXT = 'IEPGenius.';

/**
 * Deel-style loading: each character in an overflow mask rises from below,
 * staggered, holds, whole line fades, then loops. Used on route gates and overlays.
 */
export default function IepGeniusLetterReveal({
  text = DEFAULT_TEXT,
  subtitle,
  variant = 'hero',
  className = '',
  enableSweep = true,
}) {
  const raw = text != null ? String(text) : '';
  const line =
    raw.replace(/\s+/g, ' ').trim().length > 0 ? raw.replace(/\s+/g, ' ').trim() : DEFAULT_TEXT;
  const chars = useMemo(() => line.split(''), [line]);
  const n = chars.length;

  /** Stagger step per letter (seconds), in the 0.05–0.1s range */
  const staggerSec = n > 16 ? 0.055 : 0.075;
  const riseMs = 520;
  const holdMs = 520;
  const fadeMs = 420;
  const staggerMs = Math.round(staggerSec * 1000);
  const introMs = Math.max(0, n - 1) * staggerMs + riseMs;

  const [burst, setBurst] = useState(0);
  const [lineVisible, setLineVisible] = useState(true);

  useEffect(() => {
    const tFade = window.setTimeout(() => setLineVisible(false), introMs + holdMs);
    const tNext = window.setTimeout(() => {
      setLineVisible(true);
      setBurst((b) => b + 1);
    }, introMs + holdMs + fadeMs);
    return () => {
      window.clearTimeout(tFade);
      window.clearTimeout(tNext);
    };
  }, [burst, introMs, holdMs, fadeMs]);

  const textCls =
    variant === 'compact'
      ? 'text-lg font-bold tracking-tight text-slate-800'
      : line.length > 18
        ? 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900'
        : 'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900';

  const pad = variant === 'compact' ? 'rounded-lg px-2 py-2' : 'rounded-xl px-4 py-4';

  return (
    <div
      className={`flex w-full flex-col items-center justify-center text-center font-sans ${
        variant === 'hero' ? 'min-h-[40vh]' : 'min-h-0'
      } ${className}`}
    >
      <div className={`relative inline-flex max-w-[min(100%,28rem)] flex-col items-center justify-center gap-3 overflow-visible ${pad}`}>
        {enableSweep ? <LoadingSweep /> : null}
        <div
          key={burst}
          className={`relative z-[6] transition-opacity ease-out ${textCls}`}
          style={{
            transitionDuration: `${fadeMs}ms`,
            opacity: lineVisible ? 1 : 0,
          }}
          aria-label={line}
        >
          <span className="inline-flex flex-wrap items-end justify-center gap-px sm:gap-0.5">
            {chars.map((ch, i) => (
              <span
                key={`${burst}-${i}-${ch}`}
                className="inline-block overflow-hidden align-bottom leading-none"
                style={{ height: '1.15em' }}
                aria-hidden="true"
              >
                <span
                  className="deel-letter-inner inline-block"
                  style={{
                    animationDuration: `${riseMs}ms`,
                    animationDelay: `${i * staggerSec}s`,
                  }}
                >
                  {ch === ' ' ? '\u00a0' : ch}
                </span>
              </span>
            ))}
          </span>
        </div>
        {subtitle ? (
          <p
            key={`sub-${burst}`}
            className="relative z-[6] max-w-xs text-sm leading-snug text-slate-500 transition-opacity ease-out"
            style={{
              transitionDuration: `${fadeMs}ms`,
              opacity: lineVisible ? 1 : 0,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
