'use client';

import { useEffect, useState } from 'react';
import LoadingSweep from '@/components/LoadingSweep';

const DEFAULT_TEXT = 'IEPGenius';

/**
 * Deel-style staggered letter reveal, then looping wave + sweep shine.
 * variant: hero (large) | compact (table/inline)
 */
export default function IepGeniusLetterReveal({
  text = DEFAULT_TEXT,
  subtitle,
  variant = 'hero',
  className = '',
  enableSweep = true,
}) {
  const line = text || DEFAULT_TEXT;
  const staggerMs = line.length > 18 ? 38 : 65;
  const [loopLetters, setLoopLetters] = useState(false);

  useEffect(() => {
    setLoopLetters(false);
    const introMs = line.length * staggerMs + 480;
    const id = window.setTimeout(() => setLoopLetters(true), introMs);
    return () => window.clearTimeout(id);
  }, [line, staggerMs]);

  const textCls =
    variant === 'compact'
      ? 'text-lg font-bold tracking-tight text-slate-800'
      : line.length > 18
        ? 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900'
        : 'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900';

  const pad = variant === 'compact' ? 'rounded-lg px-2 py-2' : 'rounded-xl px-4 py-4';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className={`relative inline-flex max-w-[min(100%,28rem)] flex-col items-center gap-3 overflow-hidden ${pad}`}>
        {enableSweep ? <LoadingSweep /> : null}
        <div className={`relative z-[6] ${textCls}`} aria-label={line.replace(/\s+/g, ' ').trim()}>
          {line.split('').map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`inline-block ${
                loopLetters
                  ? 'animate-letter-wave'
                  : 'opacity-0 animate-letter-in'
              }`}
              style={{ animationDelay: `${i * staggerMs}ms` }}
            >
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          ))}
        </div>
        {subtitle ? (
          <p className="relative z-[6] text-sm text-slate-500 max-w-xs leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
