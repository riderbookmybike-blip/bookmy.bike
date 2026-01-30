'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Check } from 'lucide-react';

interface TemplateSwitcherProps {
    currentTemplate: string;
    onTemplateChange: (template: string) => void;
}

const templates = [
    {
        id: '1',
        name: 'The Story',
        description: 'TikTok-style social feed',
        color: 'from-indigo-900 to-black',
        icon: '📱'
    },
    {
        id: '2',
        name: 'The Garage',
        description: 'Immersive industrial hangar',
        color: 'from-red-900 to-black',
        icon: '🏭'
    },
    {
        id: '3',
        name: 'Minimal',
        description: 'Google-style search focus',
        color: 'from-blue-100 to-white',
        icon: '🔍'
    },
    {
        id: '4',
        name: 'The Ledger',
        description: 'Fintech dashboard',
        color: 'from-blue-600 to-white',
        icon: '💳'
    },
    {
        id: '5',
        name: 'Magazine',
        description: 'High-fashion editorial',
        color: 'from-zinc-300 to-white',
        icon: '📰'
    }
];

export const TemplateSwitcher: React.FC<TemplateSwitcherProps> = ({
    currentTemplate,
    onTemplateChange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20"
            >
                {isOpen ? <X size={24} className="text-white" /> : <Palette size={24} className="text-white" />}
            </motion.button>

            {/* Template Selector Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[95] bg-zinc-900 rounded-t-[3rem] border-t-2 border-white/10 shadow-2xl max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 pb-8">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                                    <h2 className="text-2xl font-black text-white mb-2">Choose Template</h2>
                                    <p className="text-sm text-zinc-500">Select your preferred homepage design</p>
                                </div>

                                {/* Template Grid */}
                                <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pb-4">
                                    {templates.map((template) => {
                                        const isActive = currentTemplate === template.id;

                                        return (
                                            <motion.button
                                                key={template.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    onTemplateChange(template.id);
                                                    setIsOpen(false);
                                                }}
                                                className="relative group"
                                            >
                                                {/* Card */}
                                                <div className={`relative aspect-[3/4] bg-gradient-to-br ${template.color} rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'border-white/10'
                                                    }`}>
                                                    {/* Icon */}
                                                    <div className="absolute top-4 left-4 text-4xl">
                                                        {template.icon}
                                                    </div>

                                                    {/* Active Checkmark */}
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                                                        >
                                                            <Check size={16} className="text-black" />
                                                        </motion.div>
                                                    )}

                                                    {/* Content */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                        <h3 className={`font-black text-sm mb-1 ${template.id === 'F' ? 'text-black' : 'text-white'}`}>
                                                            Option {template.id}
                                                        </h3>
                                                        <p className={`text-xs font-bold mb-1 ${template.id === 'F' ? 'text-black/60' : 'text-white/80'}`}>
                                                            {template.name}
                                                        </p>
                                                        <p className={`text-[10px] ${template.id === 'F' ? 'text-black/40' : 'text-white/50'}`}>
                                                            {template.description}
                                                        </p>
                                                    </div>

                                                    {/* Hover Glow */}
                                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Current Selection Info */}
                                <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                                    <p className="text-xs text-zinc-500 mb-1">Currently Active</p>
                                    <p className="text-sm font-bold text-white">
                                        Option {currentTemplate}: {templates.find(t => t.id === currentTemplate)?.name}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
