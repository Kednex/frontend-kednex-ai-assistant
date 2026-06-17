import { useCallback, useEffect, useState } from 'react';

/**
 * One-shot onboarding flag backed by localStorage. Returns whether the flag is
 * still "unseen" (so a hint should show) and a `dismiss` to mark it seen.
 *
 * SSR-safe: starts false on the server / first paint and resolves after mount,
 * so we never render a hint that the user has already dismissed. Reads are
 * guarded — third-party iframe embeds (Safari) can throw on localStorage access.
 */
export function useOnboardingFlag(key: string): { unseen: boolean; dismiss: () => void } {
    const [unseen, setUnseen] = useState(false);

    // Resolve from storage after mount (localStorage is unavailable during SSR).
    useEffect(() => {
        try {
            setUnseen(localStorage.getItem(key) !== 'true');
        } catch {
            // localStorage unavailable (e.g. sandboxed iframe) — skip the hint.
        }
    }, [key]);

    const dismiss = useCallback(() => {
        setUnseen(false);
        try {
            localStorage.setItem(key, 'true');
        } catch {
            // Best-effort; the in-memory state above still hides the hint this session.
        }
    }, [key]);

    return { unseen, dismiss };
}
