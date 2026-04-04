"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Camera, Lock } from "lucide-react";

type IntroPageProps = {
    params: Promise<{ step: string }>;
    onComplete?: () => void;
};

export default function IntroPage({ params, onComplete }: IntroPageProps) {
    const router = useRouter();
    const { step } = use(params);
    const routeStep = parseInt(step) || 1;
    const totalSteps = 2; // change to 2 steps
    const isEmbedded = typeof onComplete === "function";

    const [selectedCategory, setSelectedCategory] = useState("");
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [embeddedStep, setEmbeddedStep] = useState(routeStep);

    useEffect(() => {
        if (!isEmbedded) {
            setEmbeddedStep(routeStep);
        }
    }, [isEmbedded, routeStep]);

    const currentStep = isEmbedded ? embeddedStep : routeStep;

    const onNext = () => {
        if (currentStep < totalSteps) {
            if (isEmbedded) {
                setEmbeddedStep((prev) => Math.min(prev + 1, totalSteps));
            } else {
                router.push(`/intro/${currentStep + 1}`);
            }
        } else {
            if (isEmbedded) {
                onComplete();
            } else {
                // Finalize and go to chat route if used as standalone wizard.
                router.push("/");
            }
        }
    };

    const onPrev = () => {
        if (currentStep > 1) {
            if (isEmbedded) {
                setEmbeddedStep((prev) => Math.max(prev - 1, 1));
            } else {
                router.push(`/intro/${currentStep - 1}`);
            }
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
                    {/* {currentStep === 2 && "Let's design a space you'll love."} */}
                    {currentStep === 2 && "Get personalized product recommendations"}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {currentStep === 1 && "Discover matches made just for you."}
                    {/* {currentStep === 2 && "What item are you looking for?"} */}
                </p>
            </div>

            {/* Body Content Placeholder */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                {currentStep === 1 && (
                    <div className="w-full aspect-[4/5] bg-muted rounded-2xl flex items-center justify-center">
                        <video 
                            src="https://s3.ap-southeast-2.amazonaws.com/cdn.imersian/landing/imersian-ai-assistant.mp4"
                            className="w-full h-full object-cover"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        />
                        
                    </div>
                )}

                {/* {currentStep === 2 && (
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
                )} */}

                {currentStep === 2 && (
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
                    // disabled={(currentStep === 2 && !selectedCategory) || (currentStep === 3 && !uploadedImage)}
                >
                    {currentStep === 1 ? "Start Designing" : currentStep === totalSteps ? "Proceed" : "Next"}
                    {currentStep < totalSteps && <ChevronRight className="ml-2 w-5 h-5" />}
                </Button>
                <div className="flex justify-center gap-2 mt-6">
                    {[1, 2].map(s => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s === currentStep ? 'w-4 bg-primary' : 'w-2 bg-primary/30'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
