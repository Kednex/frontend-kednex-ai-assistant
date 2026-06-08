'use client';

import { useRef, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIntroContext } from "@/lib/store/IntroContext";
import { withCurrentQuery } from "@/lib/utils/navigation";
import { revokeBlobUrl } from "@/lib/utils/imageUtils";
import { ImagePlus, X, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateUUID } from "@/lib/utils/uuid";
import type { PreviewImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSendMessage: (message: string, base64Images: string[], previewUrls: string[]) => Promise<void>;
    isLoading: boolean;
    prefillText?: string;
    prefillToken?: number;
    hasChatHistory?: boolean;
}

export function ChatInput({ onSendMessage, isLoading, prefillText, prefillToken, hasChatHistory }: ChatInputProps) {
    const router = useRouter();
    const [input, setInput] = useState("");
    const [previews, setPreviews] = useState<PreviewImage[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { uploadedImages, clearUploadedImages } = useIntroContext();

    // Load pre-loaded images from intro on mount (and whenever the staged set changes).
    useEffect(() => {
        if (uploadedImages.length > 0) {
            const regeneratedPreviews: PreviewImage[] = uploadedImages.map((image) => ({
                id: generateUUID(),
                file: image.file,
                previewUrl: URL.createObjectURL(image.file),
            }));
            setPreviews(regeneratedPreviews);
        }
    }, [uploadedImages]);

    // Clear the composer after a send. Also empty the intro carrier so the
    // staged image isn't reloaded (on this mount or after a route round-trip).
    const clearComposer = () => {
        setPreviews([]);
        clearUploadedImages();
    };

    // Drop a clicked suggestion into the textarea (and focus it) instead of sending.
    useEffect(() => {
        if (!prefillToken) return;
        setInput(prefillText ?? "");
        textareaRef.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefillToken]);

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
        uploadedImages.push(...newPreviews); // Add to context store for access in chat session

        // Reset so the same file can be re-selected
        e.target.value = "";
    };

    const removePreview = (id: string) => {
        setPreviews((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed) revokeBlobUrl(removed.previewUrl);
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
        if (!input.trim() || isLoading) return; // Prevent sending empty messages or multiple submissions

        const messageText = input;

        // Capture preview URLs BEFORE clearing state so thumbnails can be shown in chat
        const previewUrls = previews.map((p) => p.previewUrl);
        const base64Images = await Promise.all(
            previews.map((p) => fileToBase64(p.file))
        );

        setInput("");
        clearComposer();

        await onSendMessage(messageText, base64Images, previewUrls);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    };

    // Show the "Upload Your Room" prompt only for a brand-new conversation:
    // no chat history yet and nothing staged. Once a chat exists, always show
    // the text input (more images go through the + button).
    const hasStagedImage = previews.length > 0 || uploadedImages.length > 0;
    const showUploadPrompt = !hasChatHistory && !hasStagedImage;

    return (
        <div className="border-t bg-background p-4 flex flex-col gap-3">
            {/* Previews Row */}
            {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar rounded-[var(--radius)]">
                    {previews.map((preview) => (
                        <div key={preview.id} className="relative shrink-0 group ">
                            <div className="w-20 h-20 overflow-hidden border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview.previewUrl}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    removePreview(preview.id);
                                    uploadedImages.pop(); // keep the intro context in sync
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Row */}
            <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto w-full">
                {/* attach-image button — a native label so the file picker opens reliably */}
                <Button
                    asChild
                    size="icon"
                    className="h-11 w-11 rounded-full shrink-0 cursor-pointer bg-muted/50 text-foreground shadow-sm transition-all hover:bg-muted/60 hover:text-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                    hidden={showUploadPrompt}
                >
                    <label htmlFor="chat-image-input" aria-label="Attach an image">
                        <ImagePlus size={20} />
                    </label>
                </Button>

                <div className="relative flex-1 flex items-end">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        // Show different placeholder if there are image previews to encourage description
                        placeholder={previews.length > 0 ? "Style my room..." : "Ask Anything..."}
                        className="min-h-[44px] max-h-[200px] w-full rounded-sm pl-4 pr-14 py-3 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none transition-all overflow-hidden font-sans"
                        hidden={showUploadPrompt}
                    />

                    {/* Upload prompt for a brand-new conversation — a new chat
                        always starts from the intro (upload-your-room) flow. */}
                    {showUploadPrompt && (
                        <Button
                            type="button"
                            className="w-full rounded-xl h-10 text-sm"
                            onClick={() => router.push(withCurrentQuery('/intro'))}
                        >
                            Upload Your Room
                        </Button>
                    )}
                    

                    <Button
                        type="submit"
                        size="icon"
                        // Disable send button if loading or input is empty (but allow if there are images to send)
                        disabled={isLoading || input.trim() === ""}
                        className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-sm"
                        hidden={showUploadPrompt}
                    >
                        <ArrowUp size={18} />
                    </Button>

                    <input
                        id="chat-image-input"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="sr-only"
                    />
                </div>
            </form>
        </div>
    );
}
