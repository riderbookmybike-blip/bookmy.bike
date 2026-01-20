'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type CelebrationType = 'LEAD_CREATED' | 'QUOTE_CREATED' | 'BOOKING_CREATED' | 'DELIVERY_COMPLETED';

interface CelebrateEffectProps {
    type: CelebrationType | null;
    onComplete: () => void;
}

const FLOWERS = ['🌸', '🌼', '🌷', '🌹', '🌻', '🌺'];
const GOLD_COINS = ['💰', '✨', '💎', '🏅', '🪙'];
const FIREWORKS = ['🎆', '🎇', '🧨', '💥'];

export default function CelebrateEffect({ type, onComplete }: CelebrateEffectProps) {
    type Item = { id: number; char: string; x: number; delay: number; duration: number; size?: string };
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        if (!type) return;

        let newItems: Item[] = [];
        let duration = 6000;

        if (type === 'LEAD_CREATED' || type === 'QUOTE_CREATED') {
            newItems = Array.from({ length: 40 }).map((_, i) => ({
                id: i,
                char: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
                x: Math.random() * 100,
                delay: Math.random() * 2,
                duration: 3 + Math.random() * 2
            }));
        } else if (type === 'BOOKING_CREATED') {
            newItems = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                char: GOLD_COINS[Math.floor(Math.random() * GOLD_COINS.length)],
                x: Math.random() * 100,
                delay: Math.random() * 1.5,
                duration: 2 + Math.random() * 1.5,
                size: 'text-3xl'
            }));
        } else if (type === 'DELIVERY_COMPLETED') {
            newItems = Array.from({ length: 15 }).map((_, i) => ({
                id: i,
                char: FIREWORKS[Math.floor(Math.random() * FIREWORKS.length)],
                x: 10 + Math.random() * 80,
                delay: Math.random() * 3,
                duration: 1 + Math.random() * 0.5,
                size: 'text-6xl'
            }));
        }

        setItems(newItems);
        const timer = setTimeout(() => {
            setItems([]);
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [type, onComplete]);

    if (!type) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {type === 'DELIVERY_COMPLETED' ? (
                    items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ scale: 0, x: `${item.x}vw`, y: '100vh', opacity: 1 }}
                            animate={{
                                y: `${20 + Math.random() * 30}vh`,
                                scale: [1, 2, 0],
                                opacity: [1, 1, 0]
                            }}
                            transition={{ duration: item.duration, delay: item.delay, ease: "easeOut" }}
                            className={`absolute ${item.size || 'text-2xl'}`}
                        >
                            {item.char}
                        </motion.div>
                    ))
                ) : (
                    items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ y: -50, x: `${item.x}vw`, opacity: 0, rotate: 0 }}
                            animate={{
                                y: '110vh',
                                opacity: [0, 1, 1, 0],
                                rotate: 360 * 2,
                                x: `${item.x + (Math.random() * 10 - 5)}vw`
                            }}
                            transition={{
                                duration: item.duration,
                                delay: item.delay,
                                ease: "linear"
                            }}
                            className={`absolute ${item.size || 'text-2xl'}`}
                        >
                            {item.char}
                        </motion.div>
                    ))
                )}
            </AnimatePresence>

            {(type === 'BOOKING_CREATED' || type === 'DELIVERY_COMPLETED') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 1.5 }}
                    className={`absolute inset-0 ${type === 'BOOKING_CREATED' ? 'bg-yellow-400/20' : 'bg-indigo-500/20'} mix-blend-overlay`}
                />
            )}
        </div>
    );
}
