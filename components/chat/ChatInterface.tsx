'use client';

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, PanelLeft } from "lucide-react";
import { useChatSession } from "@/hooks/useChatSession";
import { withCurrentQuery } from "@/lib/utils/navigation";
import { getRecentSessions, setActiveSession, clearActiveSession } from "@/lib/utils/sessions";
import { useAppDispatch } from "@/lib/store/hooks";
import { clearSession } from "@/lib/store/chatSlice";
import { setDesignId } from "@/lib/store/visualiserSlice";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { CapabilityCard } from "./CapabilityCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-context";
import { VISUALISE_CAPABILITY, STYLIST_CAPABILITY, ADVICE_CAPABILITY, type OnboardingCapability } from "@/lib/constants/onboarding";
import type { ChatSession } from "@/lib/types";

export function ChatInterface() {
    const dispatch = useAppDispatch();
    const { heading, welcomeMessage, MerchantSuggestions, isVisualiserEnabled } = useTheme();
    // Lead the empty state with the visualiser card where available, otherwise
    // the stylist "upload your room" framing.
    const leadCapability = isVisualiserEnabled ? VISUALISE_CAPABILITY : STYLIST_CAPABILITY;
    const {
        hydrated,
        messages,
        category,
        isLoading,
        rooms,
        sessionId,
        sendMessage,
        getChatSession,
        roomAnalysisStatus,
    } = useChatSession();

    const scrollRef = useRef<HTMLDivElement>(null);
    // Prefill payload pushed into the composer when a suggestion is clicked.
    const [prefill, setPrefill] = useState<{ text: string; token: number }>({ text: "", token: 0 });
    // Bumped to ask ChatInput to open the room-photo uploader (e.g. from the capability card).
    const [openUploaderToken, setOpenUploaderToken] = useState(0);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
    // Hide the pinned suggestions while the composer is focused (keyboard open on
    // mobile) so they don't compete for the shrunken viewport.
    const [composerFocused, setComposerFocused] = useState(false);

    const openSidebar = () => {
        setRecentSessions(getRecentSessions());
        setSidebarOpen(true);
    };

    const selectSession = (session: ChatSession) => {
        if (session.sessionId === sessionId) {
            setSidebarOpen(false);
            return;
        }
        // Make it active and hard-navigate so the chat re-hydrates from it.
        setActiveSession(session);
        window.location.assign(withCurrentQuery("/chat"));
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth"
                });
            }
        }
    };

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length, isLoading]);

    // Show a pending bubble when isLoading but no assistant message in the array yet
    const lastMessage = messages[messages.length - 1];
    const showPendingBubble = isLoading && lastMessage?.role === 'user';

    // const suggestions = [
    //     `Find ${category || 'products'} under $2000.`,
    //     `Show blue wool ${category || 'products'}.`,
    //     `Recommend washable area ${category || 'products'}.`,
    //     `List outdoor ${category || 'products'} on sale.`,
    // ];

    // Clicking a suggestion drops it into the composer (so the user can edit /
    // add their image before sending) rather than sending it immediately.
    const handleSuggestionClick = (suggestion: string) => {
        setPrefill((p) => ({ text: suggestion, token: p.token + 1 }));
    };

    // Capability card: prefill its prompt and, when the capability is
    // upload-based, open the room-photo uploader.
    const handleCapabilitySelect = (capability: OnboardingCapability) => {
        setPrefill((p) => ({ text: capability.prompt, token: p.token + 1 }));
        if (capability.opensUploader) {
            setOpenUploaderToken((t) => t + 1);
        }
    };

    const startNewChat = () => {
        // Start a fresh session in place: clear in-memory chat state and drop the
        // active-session pointer so /chat hydrates a brand-new conversation. The
        // current session stays in history and remains resumable from the sidebar.
        setSidebarOpen(false);
        dispatch(clearSession());
        dispatch(setDesignId(null));
        clearActiveSession();
        // Hard-navigate so useChatSession re-hydrates with a new sessionId.
        window.location.assign(withCurrentQuery('/chat'));
    };

    if (!hydrated) {
        return (
            <div className="p-4 h-dvh flex flex-col gap-4">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-24 w-3/4 rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-1/2 rounded-2xl self-end" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden font-sans">
            <ChatSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNewChat={startNewChat}
                sessions={recentSessions}
                onSelectSession={selectSession}
                activeSessionId={sessionId}
            />

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={openSidebar}
                        className="rounded-full"
                        aria-label="Open chat history"
                    >
                        <PanelLeft size={20} />
                    </Button>
                    <h1 className="text-base font-semibold tracking-tight">Design Assistant</h1>
                </div>
            </header>

            {/* Messages Scroll Area */}
            <ScrollArea ref={scrollRef} className="flex-1 overflow-y-auto px-4">
                <div className="py-4 flex flex-col gap-4 min-h-full ">
                    {messages.length === 0 ? (
                        <div className="flex w-full flex-col items-start text-left">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                                {heading}
                            </h2>
                            <p className="w-full text-sm font-medium text-muted-foreground mb-5 text-balance break-words">
                                {welcomeMessage}
                            </p>

                            {/* Capabilities — top aligned, 1×2 grid. Card 1 is the upload
                                value-prop (visualiser where available, else stylist); card 2
                                is styling advice (prefills a prompt, no uploader). The
                                merchant suggestions are pinned above the composer below. */}
                            <div className="w-full grid grid-cols-2 gap-2">
                                <CapabilityCard
                                    capability={leadCapability}
                                    onSelect={handleCapabilitySelect}
                                />
                                <CapabilityCard
                                    capability={ADVICE_CAPABILITY}
                                    onSelect={handleCapabilitySelect}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isLoading={isLoading}
                                    isLast={index === messages.length - 1}
                                    combinedRooms={rooms}
                                    category={category}
                                    getChatSession={getChatSession}
                                    roomAnalysisStatus={roomAnalysisStatus}
                                />
                            ))}

                            {/* Waiting bubble — shown before the first assistant chunk arrives */}
                            {showPendingBubble && (
                                <PendingBubble roomAnalysisStatus={roomAnalysisStatus} />
                            )}
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Merchant suggestions — pinned just above the composer on a fresh chat.
                Kept out of the scroll area so they sit right above the input regardless
                of content height. Bordered + merchant-themed. */}
            {messages.length === 0 && !composerFocused && MerchantSuggestions.length > 0 && (
                <div className="px-4 pt-2">
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5">
                        {MerchantSuggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                variant="outline"
                                className="w-full h-auto px-5 py-3 justify-start text-left rounded-xl border-border bg-card hover:bg-accent hover:text-accent-foreground shadow-sm transition-all active:scale-[0.98]"
                            >
                                <span className="text-sm font-semibold whitespace-normal break-words leading-snug">
                                    {suggestion}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <ChatInput
                onSendMessage={sendMessage}
                isLoading={isLoading}
                prefillText={prefill.text}
                prefillToken={prefill.token}
                openUploaderToken={openUploaderToken}
                hasChatHistory={messages.length > 0}
                onFocusChange={setComposerFocused}
            />
        </div>
    );
}

// ── Pending / waiting bubble ────────────────────────────────────────────────

type RoomStatus = 'idle' | 'analysing' | 'detected';

function PendingBubble({ roomAnalysisStatus }: { roomAnalysisStatus: RoomStatus }) {
    return (
        <div className="py-2">
            <div className="flex items-start w-full">
                <div className="w-full px-5 py-4 rounded-3xl rounded-tl-none border shadow-sm border-border bg-card text-card-foreground">
                    {roomAnalysisStatus === 'idle' ? (
                        <div className="room-analysis-container flex flex-col gap-3 py-1.5 pl-3">
                            <PendingStep
                                label="Thinking"
                                stepStatus="active"
                            />
                        </div>
                    ) : (
                        <div className="room-analysis-container flex flex-col gap-3 py-1.5 pl-3">
                            <PendingStep
                                label="Analysing your room"
                                stepStatus={roomAnalysisStatus === 'analysing' ? 'active' : 'complete'}
                            />
                            {roomAnalysisStatus === 'detected' && (
                                <PendingStep
                                    label="Room layout detected"
                                    stepStatus="active"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PendingStep({
    label,
    stepStatus,
}: {
    label: string;
    stepStatus: 'active' | 'complete';
}) {
    return (
        <div className="flex items-center gap-2.5 room-analysis-step-in">
            <div className={cn(
                "shrink-0 flex items-center justify-center",
                stepStatus === 'active' && "text-primary room-analysis-icon-glow",
                stepStatus === 'complete' && "text-green-500",
            )}>
                {stepStatus === 'complete' ? (
                    <Check className="w-3.5 h-3.5" />
                ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
            </div>
            <span className={cn(
                stepStatus === 'active' && "room-analysis-shimmer font-mono text-[11px] tracking-[0.12em] uppercase",
                stepStatus === 'complete' && "text-muted-foreground text-xs tracking-wide font-medium",
            )}>
                {label}
            </span>
        </div>
    );
}
