import type { ChatSession } from '@/lib/types';

const CHAT_SESSION_INDEX = 'imersian:chat_session_index';
const CHAT_ACTIVE_SESSION = 'imersian:chat_active_session';

/** How many recent sessions are retained in history. */
export const MAX_SAVED_SESSIONS = 6;

/**
 * Read the recent-session history from localStorage, newest first.
 * Only sessions that actually contain messages are considered resumable.
 */
export function getRecentSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = localStorage.getItem(CHAT_SESSION_INDEX);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return (parsed as ChatSession[]).filter(
            (session) => session?.sessionId && (session.messages?.length || 0) > 0
        );
    } catch {
        return [];
    }
}

/**
 * The most recent resumable session, or null when there is none.
 */
export function getLastSession(): ChatSession | null {
    return getRecentSessions()[0] ?? null;
}

/**
 * Make a session the active one so a fresh load of /chat restores it.
 * Hydration reads CHAT_ACTIVE_SESSION, so writing it here is enough to switch.
 */
export function setActiveSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CHAT_ACTIVE_SESSION, JSON.stringify(session));
    } catch {
        // ignore storage errors
    }
}

/**
 * Clear the active-session pointer so the next load of /chat starts a brand-new
 * session. The session stays in history (still resumable) — only the "active"
 * reference is removed.
 */
export function clearActiveSession(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(CHAT_ACTIVE_SESSION);
    } catch {
        // ignore storage errors
    }
}

/**
 * A short human label for a session: its first user message, else its category,
 * else a dated fallback.
 */
export function getSessionTitle(session: ChatSession): string {
    const firstUser = session.messages?.find((m) => m.role === 'user');
    const text = firstUser
        ? (firstUser.parts || [])
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join(' ')
              .trim()
        : '';

    if (text) return text;
    if (session.category) return session.category;
    return new Date(session.timestamp || Date.now()).toLocaleString();
}

/**
 * Drop a session from history (and clear it if it is the active one) so it is
 * no longer offered for resume — used when a session can't be restored.
 */
export function discardSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    try {
        const raw = localStorage.getItem(CHAT_SESSION_INDEX);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                localStorage.setItem(
                    CHAT_SESSION_INDEX,
                    JSON.stringify(arr.filter((s: any) => s?.sessionId !== sessionId))
                );
            }
        }

        const activeRaw = localStorage.getItem(CHAT_ACTIVE_SESSION);
        if (activeRaw) {
            const active = JSON.parse(activeRaw);
            if (active?.sessionId === sessionId) {
                localStorage.removeItem(CHAT_ACTIVE_SESSION);
            }
        }
    } catch {
        // best-effort cleanup; ignore storage errors
    }
}
