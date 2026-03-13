'use client';

import { useRef, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Send, Plus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateUUID } from "@/lib/utils/uuid";
import type { PreviewImage } from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSendMessage: (message: string, attachments?: string[]) => Promise<void>;
    isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [previews, setPreviews] = useState<PreviewImage[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPreviews: PreviewImage[] = files.map((file) => ({
            id: generateUUID(),
            previewUrl: URL.createObjectURL(file),
            file,
        }));
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removePreview = (id: string) => {
        setPreviews((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && previews.length === 0) || isLoading) return;

        const messageText = input;

        const base64Images = await Promise.all(
            previews.map((p) => fileToBase64(p.file))
        );

        // const attachmentUrls = previews.map((p) => p.previewUrl);
        


        setInput("");
        setPreviews([]);

        await onSendMessage(messageText, base64Images);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    };

    return (
        <div className="border-t bg-background p-4 flex flex-col gap-3">
            {/* Previews Row */}
            {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {previews.map((preview) => (
                        <div key={preview.id} className="relative shrink-0 group">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border bg-muted">
                                <Image
                                    src={preview.previewUrl}
                                    alt="preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <button
                                onClick={() => removePreview(preview.id)}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Row */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
                <div className="relative flex-1 flex items-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 bottom-1.5 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Plus size={20} />
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Type your message..."
                        className="min-h-[44px] max-h-[200px] w-full rounded-[24px] pl-11 pr-12 py-3 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none transition-all overflow-hidden"
                    />

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                </div>

                <Button
                    type="submit"
                    size="icon"
                    disabled={(!input.trim() && previews.length === 0) || isLoading}
                    className="h-11 w-11 rounded-full shrink-0 shadow-sm"
                >
                    <Send size={20} />
                </Button>
            </form>
        </div>
    );
}
