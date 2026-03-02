'use client';

import { useState, useCallback } from 'react';
import { ChatSession } from '@/lib/types';

/**
 * Hook for managing chat sessions with the Imersian backend.
 * TODO [BACKEND]: Implement these endpoints to support session persistence and history.
 */
export function useSessionManagement() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Fetch all past sessions for the authenticated user.
     * TODO [BACKEND]: GET /api/v1/sessions
     */
    const listSessions = useCallback(async (): Promise<ChatSession[]> => {
        try {
            const response = await fetch('/api/v1/sessions');
            if (!response.ok) throw new Error('Failed to list sessions');
            const data = await response.json();
            return data.sessions || [];
        } catch (err: any) {
            console.error('[useSessionManagement] listSessions error:', err);
            return [];
        }
    }, []);

    /**
     * Retrieve full details of a specific session.
     * TODO [BACKEND]: GET /api/v1/sessions/{sessionId}
     */
    const getSessionDetails = useCallback(async (sessionId: string): Promise<ChatSession | null> => {
        try {
            const response = await fetch(`/api/v1/sessions/${sessionId}`);
            if (!response.ok) throw new Error('Failed to get session details');
            return await response.json();
        } catch (err: any) {
            console.error('[useSessionManagement] getSessionDetails error:', err);
            return null;
        }
    }, []);

    /**
     * Create a new session on the backend.
     * TODO [BACKEND]: POST /api/v1/sessions
     */
    const createSession = useCallback(async (initialData: Partial<ChatSession>): Promise<string | null> => {
        try {
            const response = await fetch('/api/v1/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialData)
            });
            if (!response.ok) throw new Error('Failed to create session');
            const data = await response.json();
            return data.sessionId;
        } catch (err: any) {
            console.error('[useSessionManagement] createSession error:', err);
            return null;
        }
    }, []);

    /**
     * Delete/Archive a session.
     * TODO [BACKEND]: DELETE /api/v1/sessions/{sessionId}
     */
    const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/v1/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (err: any) {
            console.error('[useSessionManagement] deleteSession error:', err);
            return false;
        }
    }, []);

    return {
        isSyncing,
        error,
        listSessions,
        getSessionDetails,
        createSession,
        deleteSession
    };
}
