'use client';

import { Camera, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingCapability } from "@/lib/constants/onboarding";

const CAPABILITY_ICONS: Record<OnboardingCapability['id'], LucideIcon> = {
    visualise: Camera,
    stylist: Camera,
    advice: Sparkles,
};

interface CapabilityCardProps {
    capability: OnboardingCapability;
    onSelect: (capability: OnboardingCapability) => void;
    className?: string;
}

/**
 * Empty-state value-prop card. Compact vertical layout so two sit side by side
 * in a 1×2 grid. Tapping prefills the capability's prompt and, when it is
 * upload-based, opens the room uploader.
 */
export function CapabilityCard({ capability, onSelect, className }: CapabilityCardProps) {
    const Icon = CAPABILITY_ICONS[capability.id];
    return (
        <button
            type="button"
            onClick={() => onSelect(capability)}
            className={cn(
                "group flex h-full w-full flex-col items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
                className
            )}
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold leading-snug">{capability.label}</span>
                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 break-words leading-snug">
                    {capability.example}
                </span>
            </span>
        </button>
    );
}
