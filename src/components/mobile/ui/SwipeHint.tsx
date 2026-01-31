'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MoveRight } from 'lucide-react';

export const SwipeHint = ({ text = 'Swipe for details' }: { text?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 justify-center py-4 text-brand-primary font-black uppercase tracking-[0.2em] text-[8px]"
        >
            <span>{text}</span>
            <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <MoveRight size={12} />
            </motion.div>
        </motion.div>
    );
};
