"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Camera, Lock } from "lucide-react";

export default function IntroPage({ params }: { params: Promise<{ step: string }> }) {
    const router = useRouter();
    const { step } = use(params);
    const currentStep = parseInt(step) || 1;
    const totalSteps = 3;

    const [selectedCategory, setSelectedCategory] = useState("");
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const onNext = () => {
        if (currentStep < totalSteps) {
            router.push(`/intro/${currentStep + 1}`);
        } else {
            // Finalize and go to chat
            router.push("/chat");
        }
    };

    const onPrev = () => {
        if (currentStep > 1) {
            router.push(`/intro/${currentStep - 1}`);
        } else {
            router.back();
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto relative bg-background">
            {/* Header */}
            <div className="pt-8 px-6 text-center">
                {currentStep > 1 && (
                    <button onClick={onPrev} className="absolute left-4 top-8 p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <h1 className="text-2xl font-bold mt-4">
                    {currentStep === 1 && "Your Personal Interior Designer."}
                    {currentStep === 2 && "Let's design a space you'll love."}
                    {currentStep === 3 && "Get personalized product recommendations"}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {currentStep === 1 && "Discover matches made just for you."}
                    {currentStep === 2 && "What item are you looking for?"}
                </p>
            </div>

            {/* Body Content Placeholder */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                {currentStep === 1 && (
                    <div className="w-full aspect-[4/5] bg-muted rounded-2xl flex items-center justify-center">
                        [Video Player Placeholder]
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                        {['rugs', 'sofas', 'wallart', 'decor'].map(cat => (
                            <div
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`p-4 border-2 rounded-xl text-center cursor-pointer ${selectedCategory === cat ? 'border-primary bg-primary/5' : 'border-border'}`}
                            >
                                <div className="h-16 w-16 bg-muted mx-auto mb-2 rounded-lg"></div>
                                <span className="font-medium capitalize">{cat}</span>
                            </div>
                        ))}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-full aspect-square max-w-xs border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-muted/20">
                            <Camera className="w-8 h-8 text-muted-foreground mb-4" />
                            <span className="text-sm font-medium">Upload a photo of your room</span>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Your image remains private.</p>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="p-6 pb-12">
                <Button
                    className="w-full rounded-full h-12 text-lg"
                    onClick={onNext}
                    disabled={(currentStep === 2 && !selectedCategory) || (currentStep === 3 && !uploadedImage)}
                >
                    {currentStep === 1 ? "Start Designing" : currentStep === totalSteps ? "Proceed" : "Next"}
                    {currentStep < totalSteps && <ChevronRight className="ml-2 w-5 h-5" />}
                </Button>
                <div className="flex justify-center gap-2 mt-6">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s === currentStep ? 'w-4 bg-primary' : 'w-2 bg-primary/30'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
