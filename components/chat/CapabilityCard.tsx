'use client';

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingCapability } from "@/lib/constants/onboarding";

interface CapabilityCardProps {
    capability: OnboardingCapability;
    onSelect: (capability: OnboardingCapability) => void;
    className?: string;
}

/**
 * Empty-state value-prop card. Leads the first-time experience by showing the
 * visualiser capability as a tappable demo (prefills the composer and opens the
 * room uploader).
 */
export function CapabilityCard({ capability, onSelect, className }: CapabilityCardProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(capability)}
            className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
                className
            )}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Camera className="h-5 w-5" />
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
