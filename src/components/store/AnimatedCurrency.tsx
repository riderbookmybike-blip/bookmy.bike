'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSpring, useReducedMotion } from 'framer-motion';

export interface AnimatedCurrencyProps {
    value: number;
    duration?: number;
    className?: string; // applied to wrapper
    prefix?: string;
    suffix?: string;
}

export function AnimatedCurrency({
    value,
    duration = 0.45,
    className = '',
    prefix = '₹', // can be '₹ ', '+₹ ', etc.
    suffix = '',
}: AnimatedCurrencyProps) {
    const reducedMotion = useReducedMotion();
    const spanRef = useRef<HTMLSpanElement>(null);
    const prevValueRef = useRef(value);
    const [flashStatus, setFlashStatus] = useState<'idle' | 'up' | 'down'>('idle');

    // Exact tuned physics per user spec
    const springValue = useSpring(value, {
        stiffness: 180,
        damping: 24,
        mass: 0.8,
    });

    // Update text content safely without triggering React re-renders
    useEffect(() => {
        const unsubscribe = springValue.on('change', latest => {
            if (spanRef.current) {
                spanRef.current.textContent = `${prefix}${Math.round(latest).toLocaleString('en-IN')}${suffix}`;
            }
        });

        // Initial render pop
        if (spanRef.current) {
            spanRef.current.textContent = `${prefix}${Math.round(springValue.get()).toLocaleString('en-IN')}${suffix}`;
        }

        return () => unsubscribe();
    }, [springValue, prefix, suffix]);

    // Handle incoming value changes
    useEffect(() => {
        if (value !== prevValueRef.current) {
            const diff = value - prevValueRef.current;
            prevValueRef.current = value;

            // Threshold: skip animation for micro-jitters (< ₹5)
            if (!reducedMotion && Math.abs(diff) >= 5) {
                // Animate value
                springValue.set(value);

                // Set flash status (up = surge = red tint, down = discount = green tint)
                setFlashStatus(diff > 0 ? 'up' : 'down');
                const timer = setTimeout(() => {
                    setFlashStatus('idle');
                }, 260); // fast 260ms hold
                return () => clearTimeout(timer);
            } else {
                // Instant swap if reduced motion or delta < 5
                if (spanRef.current) {
                    spanRef.current.textContent = `${prefix}${Math.round(value).toLocaleString('en-IN')}${suffix}`;
                }
                springValue.set(value); // keep spring synced instantly
            }
        }
    }, [value, springValue, reducedMotion, prefix, suffix]);

    // Build flash classes
    const colorFlash =
        flashStatus === 'up'
            ? 'text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.24)] transition-none'
            : flashStatus === 'down'
              ? 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.28)] transition-none'
              : 'transition-all duration-300'; // idle crossfade back to default

    return (
        <span className={`inline-flex items-center font-mono tabular-nums ${colorFlash} ${className}`}>
            <span ref={spanRef} />
        </span>
    );
}
