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
    return String(err);
}
