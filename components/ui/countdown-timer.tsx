'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimate } from 'framer-motion';

import { cn } from '@/lib/utils';

type CountdownUnit = 'Day' | 'Hour' | 'Minute' | 'Second';

type CountdownItemProps = {
  unit: CountdownUnit;
  label: string;
  targetDate: string;
  itemClassName?: string;
};

export type ShiftingCountdownProps = {
  targetDate?: string;
  className?: string;
};

const DEFAULT_COUNTDOWN_FROM = '2026-10-01T00:00:00';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const ITEMS: Array<{ unit: CountdownUnit; label: string }> = [
  { unit: 'Day', label: 'Days' },
  { unit: 'Hour', label: 'Hours' },
  { unit: 'Minute', label: 'Minutes' },
  { unit: 'Second', label: 'Seconds' },
];

function getTimeByUnit(unit: CountdownUnit, targetDate: string): number {
  const end = new Date(targetDate);
  const now = new Date();
  const distance = end.getTime() - now.getTime();

  if (!Number.isFinite(end.getTime()) || distance <= 0) {
    return 0;
  }

  switch (unit) {
    case 'Day':
      return Math.floor(distance / DAY);
    case 'Hour':
      return Math.floor((distance % DAY) / HOUR);
    case 'Minute':
      return Math.floor((distance % HOUR) / MINUTE);
    default:
      return Math.floor((distance % MINUTE) / SECOND);
  }
}

function useTimer(unit: CountdownUnit, targetDate: string) {
  const [ref, animate] = useAnimate();
  const [time, setTime] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const handleCountdown = useCallback(async () => {
    const newTime = getTimeByUnit(unit, targetDate);

    if (newTime !== timeRef.current) {
      if (ref.current) {
        await animate(
          ref.current,
          { y: ['0%', '-40%'], opacity: [1, 0] },
          { duration: 0.3, ease: 'easeInOut' }
        );
      }

      timeRef.current = newTime;
      setTime(newTime);

      if (ref.current) {
        await animate(
          ref.current,
          { y: ['40%', '0%'], opacity: [0, 1] },
          { duration: 0.3, ease: 'easeInOut' }
        );
      }
    }
  }, [animate, ref, targetDate, unit]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const initialValue = getTimeByUnit(unit, targetDate);
    timeRef.current = initialValue;
    setTime(initialValue);

    intervalRef.current = setInterval(handleCountdown, SECOND);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleCountdown, hydrated, targetDate, unit]);

  return { ref, time };
}

function CountdownItem({ unit, label, targetDate, itemClassName }: CountdownItemProps) {
  const { ref, time } = useTimer(unit, targetDate);
  const display = unit === 'Day' ? String(time) : String(time).padStart(2, '0');

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-5 text-center backdrop-blur-sm md:px-5 md:py-6',
        itemClassName
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-60" />
      <span
        ref={ref}
        suppressHydrationWarning
        className="relative block text-4xl font-semibold tracking-tight text-white drop-shadow-sm md:text-5xl lg:text-6xl"
      >
        {display}
      </span>
      <span className="relative mt-2 block text-[11px] uppercase tracking-[0.25em] text-stone-200/80 md:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function ShiftingCountdown({
  targetDate = DEFAULT_COUNTDOWN_FROM,
  className,
}: ShiftingCountdownProps) {
  return (
    <div
      className={cn(
        'mt-8 w-full rounded-[2rem] border border-white/15 bg-gradient-to-br from-black/30 via-black/20 to-black/40 p-4 shadow-2xl shadow-black/20 md:p-6',
        className
      )}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {ITEMS.map((item) => (
          <CountdownItem
            key={item.unit}
            unit={item.unit}
            label={item.label}
            targetDate={targetDate}
          />
        ))}
      </div>
    </div>
  );
}
