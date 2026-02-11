'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getGitStatus } from '@/actions/git';
import { GitCommit, ArrowUpCircle, X, Clock, AlertTriangle, Bell, BellOff } from 'lucide-react';

export const GitReminder: React.FC = () => {
    const [status, setStatus] = useState<{
        uncommitted: number;
        unpushed: number;
        lastCommitTime: number;
        isLocalhost: boolean;
    } | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isDev, setIsDev] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasAlarmed, setHasAlarmed] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const beepRef = useRef<HTMLAudioElement | null>(null);

    const checkStatus = useCallback(async () => {
        try {
            const res = await getGitStatus();
            setStatus(res);
            // Reset alarm state if we just committed (uncommitted became 0)
            if (res.uncommitted === 0) {
                setHasAlarmed(false);
            }
        } catch (error) {
            console.error('GitReminder: Failed to fetch git status', error);
        }
    }, []);

    useEffect(() => {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        setIsDev(isLocal);

        if (isLocal) {
            checkStatus();
            const interval = setInterval(checkStatus, 15 * 60 * 1000);

            // Timer for real-time display
            const tick = setInterval(() => setCurrentTime(Date.now()), 1000);

            // Initialize audio
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            beepRef.current = new Audio(
                'data:audio/wav;base64,UklGRl9vT1R3YXZlZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT1vT1R0dnaAgYCBgoKDA4ODhISEhYWGh4eIiImKi4uMjY6OkJCSkpOUlZaXmJiam5ycnZ6en6CgoaKjpKWWmJiamqSlp6mqq7S1tri5vL6+v8DBwsPDxMXGx8jJy8zOz9DR0tPU1dbX2Nna29zd3t/f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8='
            );

            return () => {
                clearInterval(interval);
                clearInterval(tick);
            };
        }
    }, [checkStatus]);

    const playAlarm = useCallback(() => {
        if (isMuted || hasAlarmed || !beepRef.current) return;
        beepRef.current.play().catch(e => console.log('Audio play failed:', e));
        setHasAlarmed(true);
    }, [isMuted, hasAlarmed]);

    if (!isDev || !status || !isVisible) return null;

    const { uncommitted, unpushed, lastCommitTime } = status;
    const hasChanges = uncommitted > 0;
    const hasIssues = hasChanges || unpushed > 0;

    if (!hasIssues) return null;

    // Smart Heuristics
    const THRESHOLD = 15 * 60 * 1000; // 15 minutes
    const timeSinceLastCommit = currentTime - lastCommitTime;
    const timeRemaining = Math.max(0, THRESHOLD - timeSinceLastCommit);
    const isOverdue = timeSinceLastCommit > THRESHOLD;
    const isLargeChange = uncommitted > 5;
    const isUrgent = (isOverdue && hasChanges) || isLargeChange;

    // Trigger alarm sound
    if (isOverdue && hasChanges && !hasAlarmed) {
        playAlarm();
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
                className={`
                ${isUrgent ? 'bg-amber-950/90 border-amber-500/50' : 'bg-zinc-900/90 border-white/10'}
                border rounded-2xl shadow-2xl p-4 min-w-[320px] backdrop-blur-xl transition-colors duration-500
            `}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-lg ${isUrgent ? 'bg-amber-500/20' : 'bg-zinc-500/10'} flex items-center justify-center`}
                        >
                            {isUrgent ? (
                                <AlertTriangle size={18} className="text-amber-500" />
                            ) : (
                                <GitCommit size={18} className="text-zinc-400" />
                            )}
                        </div>
                        <div>
                            <div
                                className={`text-[11px] font-black uppercase tracking-widest ${isUrgent ? 'text-amber-500' : 'text-zinc-400'}`}
                            >
                                {isOverdue && hasChanges ? 'Logical Milestone Reached' : 'Commit Countdown'}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                                {isOverdue && hasChanges
                                    ? 'Commit now to avoid technical debt'
                                    : 'Localhost Sync Active'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-zinc-500 hover:text-white transition-colors p-1"
                        >
                            {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-zinc-500 hover:text-white transition-colors p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {/* Real-time Countdown Section */}
                    <div
                        className={`
                        flex items-center justify-between rounded-xl px-4 py-3 border
                        ${isOverdue && hasChanges ? 'bg-red-500/20 border-red-500/30 ring-2 ring-red-500/20 animate-pulse' : 'bg-white/[0.03] border-white/5'}
                    `}
                    >
                        <div className="flex items-center gap-3">
                            <Clock size={16} className={isOverdue && hasChanges ? 'text-red-400' : 'text-zinc-400'} />
                            <div className="flex flex-col">
                                <span
                                    className={`text-[9px] font-black uppercase tracking-wider ${isOverdue && hasChanges ? 'text-red-400' : 'text-zinc-500'}`}
                                >
                                    {isOverdue && hasChanges ? 'Overdue By' : 'Time Remaining'}
                                </span>
                                <span className="text-xl font-black tabular-nums text-white">
                                    {isOverdue && hasChanges
                                        ? formatTime(timeSinceLastCommit - THRESHOLD)
                                        : formatTime(timeRemaining)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Goal</div>
                            <div className="text-xs font-bold text-zinc-300">15:00</div>
                        </div>
                    </div>

                    {uncommitted > 0 && (
                        <div
                            className={`
                            flex items-center justify-between rounded-xl px-3 py-2 border
                            ${isLargeChange ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.03] border-white/5'}
                        `}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${isLargeChange ? 'bg-amber-500 animate-pulse' : 'bg-zinc-500'}`}
                                />
                                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">
                                    Pending Files
                                </span>
                            </div>
                            <span
                                className={`text-xs font-black tabular-nums ${isLargeChange ? 'text-amber-500' : 'text-white'}`}
                            >
                                {uncommitted}
                            </span>
                        </div>
                    )}

                    {unpushed > 0 && (
                        <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5">
                            <div className="flex items-center gap-3">
                                <ArrowUpCircle size={14} className="text-blue-400" />
                                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">
                                    Unpushed Commits
                                </span>
                            </div>
                            <span className="text-xs font-black text-white tabular-nums">{unpushed}</span>
                        </div>
                    )}
                </div>

                {isUrgent && (
                    <div className="mt-4 pt-3 border-t border-amber-500/20">
                        <div className="text-[10px] font-medium text-amber-500/80 leading-relaxed italic flex items-center gap-2">
                            <AlertTriangle size={10} />
                            Small commits = easy rollback. Save your progress!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
