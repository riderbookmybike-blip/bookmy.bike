/**
 * Safely extract an error message from an unknown catch variable.
 *
 * Usage:
 *   } catch (err) {
 *     return { error: getErrorMessage(err) };
 *   }
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;

    if (err && typeof err === 'object') {
        const maybe = err as {
            message?: unknown;
            error?: unknown;
            details?: unknown;
            hint?: unknown;
            code?: unknown;
        };

        const direct =
            (typeof maybe.message === 'string' && maybe.message) ||
            (typeof maybe.error === 'string' && maybe.error) ||
            (typeof maybe.details === 'string' && maybe.details) ||
            (typeof maybe.hint === 'string' && maybe.hint) ||
            null;

        if (direct) return direct;

        if (typeof maybe.code === 'string' && maybe.code) return `Error code: ${maybe.code}`;

        try {
            const serialized = JSON.stringify(err);
            if (serialized && serialized !== '{}') return serialized;
        } catch {
            // fallthrough to default
        }
    }

    return 'Unknown error';
}
