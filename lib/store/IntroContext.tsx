import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PreviewImage } from '@/lib/types';

interface IntroContextType {
    uploadedImages: PreviewImage[];
    setUploadedImages: (images: PreviewImage[]) => void;
    clearUploadedImages: () => void;
}

const IntroContext = createContext<IntroContextType | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
    const [uploadedImages, setUploadedImages] = useState<PreviewImage[]>([]);

    const clearUploadedImages = () => setUploadedImages([]);
    // log uploadimages length after reset
    console.log("Uploaded images in context after reset:", uploadedImages.length);
    return (
        <IntroContext.Provider value={{ uploadedImages, setUploadedImages, clearUploadedImages }}>
            {children}
        </IntroContext.Provider>
    );
}

export function useIntroContext() {
    const context = useContext(IntroContext);
    if (!context) {
        throw new Error('useIntroContext must be used within IntroProvider');
    }
    return context;
}
