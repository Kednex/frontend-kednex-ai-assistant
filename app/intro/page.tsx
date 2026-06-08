"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntroScreen } from "@/components/intro/IntroScreen";
import { useIntroContext } from "@/lib/store/IntroContext";
import { useAppDispatch } from "@/lib/store/hooks";
import { setIntent, clearSession } from "@/lib/store/chatSlice";
import { setDesignId } from "@/lib/store/visualiserSlice";
import { getLastSession, discardSession, clearActiveSession } from "@/lib/utils/sessions";
import type { ChatSession, PreviewImage } from "@/lib/types";

function IntroInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const { setUploadedImages } = useIntroContext();

    // Detect a resumable session on the client (localStorage is unavailable on the server).
    const [lastSession, setLastSession] = useState<ChatSession | null>(null);
    const [resumeError, setResumeError] = useState<string | null>(null);
    useEffect(() => {
        setLastSession(getLastSession());
    }, []);

    const goToChat = useCallback(() => {
        const params = searchParams.toString();
        router.push(`/chat${params ? `?${params}` : ""}`);
    }, [router, searchParams]);

    // Start a clean session: clear in-memory chat state AND drop the active-session
    // pointer so /chat doesn't re-hydrate the previous conversation. The old session
    // stays in history (still resumable).
    const resetToFreshSession = useCallback(() => {
        dispatch(clearSession());
        dispatch(setDesignId(null));
        clearActiveSession();
    }, [dispatch]);

    // "Upload Your Room" — always starts a fresh session. The previous session
    // stays in history (resumable later) but is no longer the active one.
    const handleIntroComplete = useCallback((images: PreviewImage[]) => {
        setUploadedImages(images);
        resetToFreshSession();
        goToChat();
    }, [setUploadedImages, resetToFreshSession, goToChat]);

    // "Resume last session" — restore chat history + 3D reconstructed room.
    // Without a designId we can't rebuild the 3D room / hosted assets, so the
    // session can't be meaningfully restored: discard it and stay on the intro.
    const handleResume = useCallback(() => {
        if (!lastSession) return;

        if (!lastSession.designId) {
            discardSession(lastSession.sessionId);
            resetToFreshSession();
            setLastSession(null);
            setResumeError("Couldn't restore your previous session. Starting a new one.");
            return;
        }

        dispatch(setIntent(lastSession));
        dispatch(setDesignId(lastSession.designId));
        goToChat();
    }, [lastSession, dispatch, resetToFreshSession, goToChat]);

    return (
        <IntroScreen
            step={1}
            onComplete={handleIntroComplete}
            hasResumableSession={!!lastSession}
            onResume={handleResume}
            error={resumeError}
        />
    );
}

export default function Intro() {
    return (
        <Suspense fallback={null}>
            <IntroInner />
        </Suspense>
    );
}
