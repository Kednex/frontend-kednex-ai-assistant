'use client';

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Check, Loader2, Plus } from "lucide-react";
import { useChatSession } from "@/hooks/useChatSession";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-context";
import type { PreviewImage } from "@/lib/types";

export function ChatInterface() {
    const { welcomeMessage, MerchantSuggestions } = useTheme();
    const {
        hydrated,
        messages,
        category,
        isLoading,
        rooms,
        sendMessage,
        getChatSession,
        roomAnalysisStatus,
    } = useChatSession();

    

    const scrollRef = useRef<HTMLDivElement>(null);
    const [composerPreviews, setComposerPreviews] = useState<PreviewImage[]>([]);
    const [resetPreviewsToken, setResetPreviewsToken] = useState(0);

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

    // when clicking a suggestion, send it as a message
    const handleSuggestionClick = async (suggestion: string) => {
        const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        const previewUrls = composerPreviews.map((p) => p.previewUrl);
        const base64Images = await Promise.all(
            composerPreviews.map((p) => fileToBase64(p.file))
        );

        await sendMessage(suggestion, base64Images, previewUrls);

        // Reset previews in composer after suggestion send to match send button behavior.
        setComposerPreviews([]);
        setResetPreviewsToken((prev) => prev + 1);
    };

    const startNewChat = () => {
        // Clear session and store to start fresh
        localStorage.removeItem('imersian:chat_active_session');
        window.location.reload(); // Hard refresh to ensure clean state
    };

    if (!hydrated) {
        return (
            <div className="p-4 h-screen flex flex-col gap-4">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-24 w-3/4 rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-1/2 rounded-2xl self-end" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={startNewChat}
                        className="rounded-full"
                    >
                        <Plus size={20} />
                        
                    </Button>
                    <h1 className="text-base font-semibold tracking-tight">Design Assistant</h1>
                </div>
            </header>

            {/* Messages Scroll Area */}
            <ScrollArea ref={scrollRef} className="flex-1 overflow-y-auto px-4">
                <div className="py-6 flex flex-col gap-4 min-h-full ">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-start justify-start flex-1 text-left min-h-[400px]">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-2">
                                Hello there!
                            </h2>
                            <p className="text-lg font-medium text-muted-foreground mb-8">
                                {welcomeMessage}
                                
                            </p>

                            <div className="flex-1" aria-hidden="true" />

                            {/* Suggestions Grid */}
                            <div className="w-full flex flex-col gap-2.5 mt-auto">
                                {MerchantSuggestions.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => void handleSuggestionClick(suggestion)}
                                        variant="outline"
                                        className="w-full h-auto px-6 py-4 justify-start text-left rounded-sm border-border bg-card hover:bg-accent hover:text-accent-foreground shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        <span className="text-sm font-bold truncate">
                                            {suggestion}
                                        </span>
                                    </Button>
                                ))}
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

            {/* Input Area */}
            <ChatInput
                onSendMessage={sendMessage}
                isLoading={isLoading}
                onPreviewsChange={setComposerPreviews}
                resetPreviewsToken={resetPreviewsToken}

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
