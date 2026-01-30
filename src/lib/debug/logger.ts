import { adminClient } from '@/lib/supabase/admin';

export type LogStatus = 'START' | 'SUCCESS' | 'ERROR' | 'INFO';

export interface LogEntry {
    component: string;
    action: string;
    status: LogStatus;
    message?: string;
    payload?: any;
    error?: any;
    duration_ms?: number;
}

/**
 * serverLog
 * Utility to write logs to the debug_logs table for real-time tracing.
 */
export async function serverLog(data: LogEntry) {
    try {
        // Serialize error object if it's an Error instance
        let serializedError = data.error;
        if (data.error instanceof Error) {
            serializedError = {
                name: data.error.name,
                message: data.error.message,
                stack: data.error.stack,
                // Capture any extra properties (like those from Supabase/Postgres)
                ...Object.getOwnPropertyNames(data.error).reduce((acc: any, key) => {
                    acc[key] = (data.error as any)[key];
                    return acc;
                }, {})
            };
        }

        const { error } = await adminClient
            .from('debug_logs')
            .insert({
                component: data.component,
                action: data.action,
                status: data.status,
                message: data.message,
                payload: data.payload || {},
                error: serializedError || {},
                duration_ms: data.duration_ms
            });
        // ...

        if (error) {
            console.warn('[Logger] Failed to write to debug_logs:', error.message);
        }
    } catch (err) {
        console.warn('[Logger] Fatal error in serverLog:', err);
    }
}
