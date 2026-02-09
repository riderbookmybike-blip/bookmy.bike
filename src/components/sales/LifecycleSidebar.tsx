import React from 'react';
import { CheckCircle, Lock, AlertCircle, FileText } from 'lucide-react';
import { OperationalStage, BookingStatus } from '@/types/booking';

const STAGES: { id: OperationalStage; label: string; icon: React.ElementType }[] = [
    { id: 'QUOTE', label: 'Quote', icon: FileText },
    { id: 'BOOKING', label: 'Booking', icon: CheckCircle },
    { id: 'PAYMENT', label: 'Payment', icon: CheckCircle },
    { id: 'FINANCE', label: 'Finance', icon: CheckCircle },
    { id: 'ALLOTMENT', label: 'Allotment', icon: CheckCircle },
    { id: 'COMPLIANCE', label: 'Compliance', icon: CheckCircle },
    { id: 'DELIVERED', label: 'Delivery', icon: CheckCircle },
];

interface LifecycleSidebarProps {
    currentStage: OperationalStage;
    status: BookingStatus;
    onStageSelect: (stage: OperationalStage) => void;
}

export default function LifecycleSidebar({ currentStage, status, onStageSelect }: LifecycleSidebarProps) {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);
    const isFrozen = ['DENIED', 'CANCELED'].includes(status);
    const isReadOnly = status === 'SUPERSEDED';

    return (
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col shrink-0">
            <div className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Execution Flow</h3>

                <div className="space-y-1">
                    {STAGES.map((stage, index) => {
                        const isActive = currentStage === stage.id;
                        const isCompleted = index < currentIndex;
                        const isLocked = index > currentIndex || isFrozen;

                        return (
                            <button
                                key={stage.id}
                                disabled={isLocked && !isActive}
                                onClick={() => onStageSelect(stage.id)}
                                className={`w-full group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                                    ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : isCompleted
                                              ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                              : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                                    }
                                `}
                            >
                                {/* Vertical Connector Line */}
                                {index < STAGES.length - 1 && (
                                    <div
                                        className={`absolute left-[26px] top-10 w-px h-6 z-0
                                        ${index < currentIndex ? 'bg-blue-400' : 'bg-slate-200 dark:bg-slate-800'}
                                    `}
                                    />
                                )}

                                <div
                                    className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors
                                    ${
                                        isActive
                                            ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900'
                                            : isCompleted
                                              ? 'border-blue-400 dark:border-blue-500 bg-blue-400 dark:bg-blue-500'
                                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }
                                `}
                                >
                                    {isCompleted ? (
                                        <CheckCircle size={10} className="text-white" />
                                    ) : isActive ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    )}
                                </div>

                                <div className="flex flex-col items-start min-w-0">
                                    <span
                                        className={`text-xs font-bold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : ''}`}
                                    >
                                        {stage.label}
                                    </span>
                                    {isActive && (
                                        <span className="text-[9px] font-medium text-blue-500 dark:text-blue-400 uppercase tracking-tighter">
                                            Currently Active
                                        </span>
                                    )}
                                </div>

                                {isLocked && !isActive && (
                                    <Lock size={12} className="ml-auto text-slate-300 dark:text-slate-700" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {(isFrozen || isReadOnly) && (
                <div
                    className={`mt-auto p-4 m-4 rounded-2xl border flex flex-col gap-2 
                    ${
                        isFrozen
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                    }
                `}
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isFrozen ? 'Workflow Frozen' : 'Read-Only View'}
                        </span>
                    </div>
                    <p className="text-[10px] leading-relaxed opacity-80">
                        {isFrozen
                            ? `This record's status is ${status}. Further operational changes are blocked.`
                            : `This record has been SUPERSEDED. Please refer to the latest version for active operations.`}
                    </p>
                </div>
            )}
        </div>
    );
}
