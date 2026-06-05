"use client";

import { use, useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Camera, Lock } from "lucide-react";
import { generateUUID } from "@/lib/utils/uuid";
import type { PreviewImage } from "@/lib/types";
import Image from "next/image";

type IntroPageProps = {
    params: Promise<{ step: string }>;
    onComplete?: (images: PreviewImage[]) => void;
};

export default function IntroPage({ params, onComplete }: IntroPageProps) {
    const router = useRouter();
    const { step } = use(params);
    const routeStep = parseInt(step) || 1;
    const totalSteps = 1; // change to 2 steps
    const isEmbedded = typeof onComplete === "function";

    const [previews, setPreviews] = useState<PreviewImage[]>([]);
    
    const [embeddedStep, setEmbeddedStep] = useState(routeStep);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // file upload handler
    const fileInputRef = useRef<HTMLInputElement>(null);


    const readFileWithProgress = (file: File) => {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            reader.onload = () => {
                setUploadProgress(100);
                resolve();
            };

            reader.onerror = () => {
                reject(new Error("Failed to process selected image."));
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {

        const files = Array.from(e.target.files || []);
        const selectedFile = files[0];
        if (!selectedFile) {
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            await readFileWithProgress(selectedFile);
        } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            e.target.value = "";
            return;
        }

        const newPreview: PreviewImage = {
            id: generateUUID(),
            previewUrl: URL.createObjectURL(selectedFile),
            file: selectedFile,
        };

        // Keep only one room photo and clean old blob URLs.
        setPreviews((prev) => {
            prev.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
            return [newPreview];
            // return [newPreview];

        });


        // send files to parent if in embedded mode
        if (isEmbedded) {
            onComplete?.([newPreview]);
        } else {
            router.push("/");
        }

        setIsUploading(false);
        setUploadProgress(0);

        // Reset so the same file can be re-selected
        e.target.value = "";
    };

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
        };
    }, [previews]);

    const currentStep = isEmbedded ? embeddedStep : routeStep;
    const currentPreview = previews[0];

    const onNext = () => {
        if (currentStep < totalSteps) {
            if (isEmbedded) {
                setEmbeddedStep((prev) => Math.min(prev + 1, totalSteps));
            } else {
                router.push(`/intro/${currentStep + 1}`);
            }
        } else {
            if (isEmbedded) {
                onComplete?.(previews);
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
                    // <div className="w-full aspect-[4/5] bg-muted rounded-2xl flex items-center justify-center">
                    //     <video 
                    //         src="https://s3.ap-southeast-2.amazonaws.com/cdn.imersian/landing/imersian-ai-assistant.mp4"
                    //         className="w-full h-full object-cover"
                    //         autoPlay 
                    //         loop 
                    //         muted 
                    //         playsInline
                    //     />
                        
                    // </div>

                    

                    <div className="flex flex-col items-center justify-center h-full gap-4">

                        
                        <div className="overflow-hidden rounded-2xl shadow-sm bg-muted">
                            <video 
                                src="https://s3.ap-southeast-2.amazonaws.com/cdn.imersian/landing/imersian-ai-assistant.mp4"
                                className="w-full h-full object-cover"
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                            />
                        </div>
                        
                        
                        


                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        

                        

                        {currentPreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-base font-semibold text-primary h-auto p-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Change photo
                            </Button>
                        )}

                        {isUploading && (
                            <div className="w-full max-w-xs">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-150"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground text-center">
                                    Uploading photo... {uploadProgress}%
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Your image remains private and safe.
                        </p>
                    </div>


                )}

                



                {currentStep === 2 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <div className="w-full aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-muted/20 overflow-hidden">
                            {currentPreview ? (
                                <Image
                                    src={currentPreview.previewUrl}
                                    alt="Uploaded room preview"
                                    className="w-full h-full object-cover"
                                    fill
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    {/* 1. The Icon and Text Label */}
                                    <div className="flex flex-col items-center">
                                        <Camera className="w-8 h-8 text-muted-foreground mb-2 text-primary" onClick={() => fileInputRef.current?.click()}/>
                                        <span className="text-sm font-medium text-center">Upload a photo of your room</span>
                                    </div>

                                    {/* 2. The Separate Button */}
                                    <Button
                                        type="button"
                                        className="h-10 px-6 rounded-sm bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload Image
                                    </Button>
                                </div>
                            )}
                        </div>

                        

                        {currentPreview && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-base font-semibold text-primary h-auto p-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Change photo
                            </Button>
                        )}

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Your image remains private and safe.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="p-6 pb-12">
                <Button
                    variant="default"
                    className="w-full rounded-xl h-12 text-lg cursor-pointer"
                    // onClick={onNext}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    // disabled={(currentStep === 2 && !selectedCategory) || (currentStep === 3 && !uploadedImage)}
                >
                    {isUploading
                        ? `Uploading... ${uploadProgress}%`
                        : currentStep === 1
                            ? "Upload Your Room"
                            : currentStep === totalSteps
                                ? "Proceed"
                                : "Next"}
                    {currentStep < totalSteps && <ChevronRight className="ml-2 w-5 h-5" />}
                </Button>
                {/* <div className="flex justify-center gap-2 mt-6">
                    {[1, 2].map(s => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s === currentStep ? 'w-4 bg-primary' : 'w-2 bg-primary/30'}`} />
                    ))}
                </div> */}
            </div>
        </div>
    );
}
