'use client';

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import type { Message, RoomContext, ChatSession } from "@/lib/types";
import RenderMarkdown from "./RenderMarkdown";
import { Check, Loader2, LayoutDashboard, ScanLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import ProductSearchResults from "../product/ProductSearchResults";

interface MessageBubbleProps {
    message: Message;
    isLoading: boolean;
    isLast: boolean;
    combinedRooms: RoomContext[];
    category: string;
    getChatSession: () => ChatSession;
    roomAnalysisStatus?: 'idle' | 'analysing' | 'detected';
}

export function MessageBubble({
    message,
    isLoading,
    isLast,
    combinedRooms,
    category,
    getChatSession,
    roomAnalysisStatus = 'idle', // this shows the system status if the message is streaming and has no content yet
}: MessageBubbleProps) {
    const isAssistant = message.role === "assistant";
    const isStreaming = isAssistant && isLoading && isLast;

    // AI SDK 6.0: Combine text parts for content
    const content = useMemo(() => {
        if (!message.parts) return (message as any).content?.trim() || "";
        return message.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => (p as any).text)
            .join("")
            .trim();
    }, [message]);

    // Extract attachments from parts or top-level (for backwards compatibility)
    const attachments = useMemo(() => {
        const topLevel = message.attachments || [];
        const partAttachments = (message.parts || [])
            .filter((p: any) => p.type === "file")
            .map((p: any) => p.url)
            .filter(Boolean) as string[];

        // Return unique set of attachments
        return Array.from(new Set([...topLevel, ...partAttachments]));
    }, [message.attachments, message.parts]);

    // Extract search payload from data parts
    const searchPayload = useMemo(() => {
        if (message.searchPayload) return message.searchPayload;
        const dataPart = message.parts?.find((p: any) => p.type === 'data-searchPayload');
        return (dataPart as any)?.data;
    }, [message.parts, message.searchPayload]);

    // Markdown Stability: Append phantom newlines while streaming
    const processedContent = useMemo(() => {
        if (!content) return "";
        return isStreaming ? `${content}\n\n` : content;
    }, [content, isStreaming]);

    const renderedMarkdown = useMemo(() => {
        if (!processedContent) return null;
        return RenderMarkdown(processedContent);
    }, [processedContent]);

    // Decide what to show in the assistant bubble while streaming with no content yet
    const showRoomAnalysis = isStreaming && !content && roomAnalysisStatus !== 'idle';
    const showTypingFallback = isStreaming && !content && roomAnalysisStatus === 'idle';

    return (
        <div className="py-2 flex flex-col gap-3">
            {/* User attachments (first row, right-aligned) */}
            {message.role === "user" && attachments.length > 0 && (
                <div className="flex justify-end w-full mb-1">
                    <div className="flex gap-2 flex-wrap justify-end">
                        {attachments.map((url, i) => (
                            <UserAttachment key={`${message.id}-att-${i}`} url={url} />
                        ))}
                    </div>
                </div>
            )}

            {/* Text bubble */}
            <div className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
            )}>
                {isAssistant ? (
                    <div className="flex items-start w-full gap-3">
                        {/* Avatar */}
                        {/* {!isLast && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback className="bg-background text-foreground text-xs font-bold">A</AvatarFallback>
                            </Avatar>
                        )} */}

                        {/* Assistant content */}
                        <div className={cn(
                            "w-full p-2 rounded-sm rounded-tl-none overflow-hidden border shadow-sm",
                            message.isError ? "border-destructive/50 bg-destructive/5 text-destructive" : "border-border bg-card text-card-foreground"
                        )}>
                            {/* Room analysis thinking indicator */}
                            {showRoomAnalysis ? (
                                <RoomAnalysisIndicator status={roomAnalysisStatus as 'analysing' | 'detected'} />
                            ) : showTypingFallback ? (
                                <ChatTypingIndicator />
                            ) : content ? (
                                <div className={cn(
                                    "text-sm p-1 leading-relaxed",
                                    isStreaming && "opacity-90"
                                )}>
                                    {renderedMarkdown}
                                </div>
                            ) : null}

                            {/* Product search results */}
                            {searchPayload && (
                                <div className="mt-4">
                                    <ProductSearchResults
                                        searchPayload={searchPayload}
                                        cachedProducts={searchPayload.products?.length ? searchPayload.products : undefined}
                                        category={category}
                                        getChatSession={getChatSession}
                                        rooms={combinedRooms}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[85%] p-2 rounded-sm rounded-br-none bg-primary text-primary-foreground shadow-sm">
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-components

// this is shown in the assistant bubble while waiting for the first chunk to arrive, or if the first chunk has no text content (e.g. starts with an image or product search results)
function RoomAnalysisIndicator({ status }: { status: 'analysing' | 'detected' }) {
    return (
        <div className="room-analysis-container flex flex-col gap-3 py-1.5 pl-3">
            <AnalysisStep
                icon={<ScanLine className="w-3.5 h-3.5" />}
                label="Analysing your room"
                stepStatus={status === 'analysing' ? 'active' : 'complete'}
            />
            {status === 'detected' && (
                <AnalysisStep
                    icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                    label="Room layout detected"
                    stepStatus="active"
                />
            )}
        </div>
    );
}

function AnalysisStep({
    icon,
    label,
    stepStatus,
}: {
    icon: ReactNode;
    label: string;
    stepStatus: 'pending' | 'active' | 'complete';
}) {
    return (
        <div className={cn(
            "flex items-center gap-2.5 room-analysis-step-in",
            stepStatus === 'pending' && "opacity-30",
        )}>
            <div className={cn(
                "shrink-0 flex items-center justify-center",
                stepStatus === 'active' && "text-primary room-analysis-icon-glow",
                stepStatus === 'complete' && "text-green-500",
                stepStatus === 'pending' && "text-muted-foreground",
            )}>
                {stepStatus === 'complete' ? (
                    <Check className="w-3.5 h-3.5" />
                ) : stepStatus === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    icon
                )}
            </div>
            <span className={cn(
                stepStatus === 'active' && "room-analysis-shimmer font-mono text-[11px] tracking-[0.12em] uppercase",
                stepStatus === 'complete' && "text-muted-foreground text-xs tracking-wide font-medium",
                stepStatus === 'pending' && "text-muted-foreground text-xs",
            )}>
                {label}
            </span>
        </div>
    );
}

function ChatTypingIndicator() {
    return (
        <div className="room-analysis-container flex flex-col gap-3 py-1.5 pl-3">
            <AnalysisStep
                icon={<Sparkles className="w-3.5 h-3.5" />}
                label="Thinking"
                stepStatus="active"
            />
        </div>
    );
}

function UserAttachment({ url }: { url: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="relative w-48 aspect-square rounded-sm overflow-hidden border shadow-sm bg-background">
            <div className={cn(
                "w-full h-full transition-opacity duration-500",
                loaded ? "opacity-100" : "opacity-0"
            )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {url && (
                    <Image
                        src={url}
                        alt="attachment"
                        onLoad={() => setLoaded(true)}
                        fill
                        className="object-cover"
                    />
                )}

            </div>
        </div>
    );
}

