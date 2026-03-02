'use client';

import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useChatSession } from "@/hooks/useChatSession";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ChatInterface() {
    const {
        hydrated,
        messages,
        category,
        isLoading,
        rooms,
        sendMessage,
        getChatSession,
    } = useChatSession();

    const scrollRef = useRef<HTMLDivElement>(null);

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

    const suggestions = [
        `Find ${category || 'products'} under $2000.`,
        `Show blue wool ${category || 'products'}.`,
        `Recommend washable area ${category || 'products'}.`,
        `List outdoor ${category || 'products'} on sale.`,
    ];

    const handleSuggestionClick = (suggestion: string) => {
        void sendMessage(suggestion);
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
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-base font-semibold tracking-tight">Design Assistant</h1>
                </div>
            </header>

            {/* Messages Scroll Area */}
            <ScrollArea ref={scrollRef} className="flex-1 overflow-y-auto px-4">
                <div className="py-6 flex flex-col gap-4 min-h-full">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-start justify-start flex-1 text-left min-h-[400px]">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-2">
                                Hello there!
                            </h2>
                            <p className="text-lg font-medium text-muted-foreground mb-8">
                                How can I help you today?
                            </p>

                            <div className="flex-1" aria-hidden="true" />

                            {/* Suggestions Grid */}
                            <div className="w-full flex flex-col gap-2.5 mt-auto">
                                {suggestions.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        variant="outline"
                                        className="w-full h-auto px-6 py-4 justify-start text-left rounded-3xl border-border bg-card hover:bg-accent hover:text-accent-foreground shadow-sm transition-all active:scale-[0.98]"
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
                                />
                            ))}
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
    );
}
