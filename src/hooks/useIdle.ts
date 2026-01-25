'use client';

import { useState, useEffect } from 'react';

export function useIdle(timeout: number = 30000) {
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const resetTimer = () => {
            setIsIdle(false);
            clearTimeout(timer);
            timer = setTimeout(() => setIsIdle(true), timeout);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            clearTimeout(timer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [timeout]);

    return isIdle;
}
