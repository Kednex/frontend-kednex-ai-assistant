'use client';

import { Plus, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionTitle } from "@/lib/utils/sessions";
import type { ChatSession } from "@/lib/types";

type ChatSidebarProps = {
    open: boolean;
    onClose: () => void;
    onNewChat: () => void;
    sessions: ChatSession[];
    onSelectSession: (session: ChatSession) => void;
    activeSessionId?: string | null;
};

export function ChatSidebar({
    open,
    onClose,
    onNewChat,
    sessions,
    onSelectSession,
    activeSessionId,
}: ChatSidebarProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-card shadow-xl transition-transform duration-200",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                role="dialog"
                aria-label="Chat history"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-semibold">Chats</span>
                    <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 rounded-xl h-10"
                        onClick={onNewChat}
                    >
                        <Plus size={18} />
                        New chat
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3">
                    <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Recent</p>

                    {sessions.length === 0 ? (
                        <p className="px-1 text-sm text-muted-foreground">No previous chats.</p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {sessions.map((session) => (
                                <li key={session.sessionId}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectSession(session)}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                            session.sessionId === activeSessionId && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <MessageSquare size={16} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">{getSessionTitle(session)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>
        </>
    );
}
