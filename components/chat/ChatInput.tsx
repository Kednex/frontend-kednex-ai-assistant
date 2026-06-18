'use client';

import { useRef, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useIntroContext } from "@/lib/store/IntroContext";
import { useOnboardingFlag } from "@/hooks/useOnboardingFlag";
import { revokeBlobUrl, fileToBase64 } from "@/lib/utils/imageUtils";
import { ImagePlus, X, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateUUID } from "@/lib/utils/uuid";
import type { PreviewImage } from "@/lib/types";

const UPLOAD_NUDGE_KEY = 'imersian:onboarding_upload_nudge_seen';

interface ChatInputProps {
    onSendMessage: (message: string, base64Images: string[], previewUrls: string[]) => Promise<void>;
    isLoading: boolean;
    prefillText?: string;
    prefillToken?: number;
    openUploaderToken?: number;
    hasChatHistory?: boolean;
    onFocusChange?: (focused: boolean) => void;
}

export function ChatInput({ onSendMessage, isLoading, prefillText, prefillToken, openUploaderToken, hasChatHistory, onFocusChange }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [previews, setPreviews] = useState<PreviewImage[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadedImages, clearUploadedImages } = useIntroContext();
    const { unseen: uploadNudgeUnseen, dismiss: dismissUploadNudge } = useOnboardingFlag(UPLOAD_NUDGE_KEY);

    // First-time hint pointing at the attach button — shown once the chat has
    // started (the empty state already leads with the upload capability card),
    // with nothing staged, until the user has seen it once.
    const showUploadNudge = uploadNudgeUnseen && !!hasChatHistory && previews.length === 0;

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

    // Open the room-photo picker when asked (e.g. from the empty-state capability card).
    useEffect(() => {
        if (!openUploaderToken) return;
        fileInputRef.current?.click();
    }, [openUploaderToken]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // TODO [PR-522]: Once the backend supports a per-attachment role, add a
    // per-image toggle (My room / Reference) here so users can attach
    // inspiration/context images without triggering room reconstruction.
    // https://linear.app/imersian/issue/PR-522
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // A single room photo per message: replace any previously staged image
        // (revoking its blob URL) rather than accumulating, so the visualiser
        // input is unambiguous — exactly one image drives the room.
        previews.forEach((p) => revokeBlobUrl(p.previewUrl));

        const newPreview: PreviewImage = {
            id: generateUUID(),
            previewUrl: URL.createObjectURL(file),
            file,
        };
        setPreviews([newPreview]);

        // Keep the intro context in sync — single entry, replaced in place so the
        // regeneration effect doesn't churn blob URLs.
        uploadedImages.splice(0, uploadedImages.length, newPreview);

        // Reset so the same file can be re-selected
        e.target.value = "";
    };

    const removePreview = (id: string) => {
        const removed = previews.find((p) => p.id === id);
        if (removed) {
            revokeBlobUrl(removed.previewUrl);
            // Drop the matching entry from the intro context too. Match by File
            // reference (stable across both the chat-upload and intro-staged
            // paths) rather than position, so removing a non-last image doesn't
            // desync previews from uploadedImages. Mutated in place — like the
            // push in handleFileChange — to avoid retriggering the regeneration
            // effect (which would churn blob URLs).
            const idx = uploadedImages.findIndex((img) => img.file === removed.file);
            if (idx !== -1) uploadedImages.splice(idx, 1);
        }
        setPreviews((prev) => prev.filter((p) => p.id !== id));
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

    return (
        <div className="border-t bg-background p-4 flex flex-col gap-3">
            {/* Previews Row — a single staged room photo. */}
            {previews.length > 0 && (
                <div className="flex flex-col gap-1.5">
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
                                    onClick={() => removePreview(preview.id)}
                                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="px-0.5 text-xs text-muted-foreground">
                        Your room image will be used to match products to your room.
                    </p>
                </div>
            )}

            {/* Input Row */}
            <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto w-full">
                {/* attach-image button — a native label so the file picker opens reliably */}
                <div className="relative shrink-0">
                    <Button
                        asChild
                        size="icon"
                        className="h-11 w-11 rounded-full cursor-pointer bg-muted/50 text-foreground shadow-sm transition-all hover:bg-muted/60 hover:text-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                    >
                        <label htmlFor="chat-image-input" aria-label="Attach an image" onClick={dismissUploadNudge}>
                            <ImagePlus size={20} />
                        </label>
                    </Button>

                    {/* One-time onboarding hint for the optional room upload. */}
                    {showUploadNudge && (
                        <div
                            role="status"
                            className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
                        >
                            <button
                                type="button"
                                onClick={dismissUploadNudge}
                                aria-label="Dismiss"
                                className="absolute -top-1.5 -right-1.5 rounded-full bg-muted p-0.5 text-muted-foreground shadow-sm hover:bg-muted/80"
                            >
                                <X size={12} />
                            </button>
                            <span className="font-medium">📸 Add a room photo</span> for picks tailored to your space.
                        </div>
                    )}
                </div>

                <div className="relative flex-1 flex items-end">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        onFocus={() => onFocusChange?.(true)}
                        onBlur={() => onFocusChange?.(false)}
                        // Show different placeholder if there are image previews to encourage description
                        placeholder={previews.length > 0 ? "Style my room..." : "Ask Anything..."}
                        className="min-h-[44px] max-h-[200px] w-full rounded-sm pl-4 pr-14 py-3 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none transition-all overflow-hidden font-sans"
                    />

                    <Button
                        type="submit"
                        size="icon"
                        // Disable send button if loading or input is empty (but allow if there are images to send)
                        disabled={isLoading || input.trim() === ""}
                        className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-sm"
                    >
                        <ArrowUp size={18} />
                    </Button>

                    <input
                        id="chat-image-input"
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="sr-only"
                    />
                </div>
            </form>
            <p className="px-0.5 text-xs text-muted-foreground">
                Your images remain private. Learn more : <a href="https://www.imersian.com/legal/privacy-policy" className="underline hover:text-foreground">Imersian's privacy policy</a>.
            </p>
        </div>
    );
}
