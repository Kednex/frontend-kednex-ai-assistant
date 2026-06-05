"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
    const router = useRouter();
    const { productId } = use(params);

    // In a full implementation, we would fetch product details using the productId
    // For now, simulating loading state
    const [product, setProduct] = useState<any>(null);

    return (
        <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center p-4 border-b">
                <button onClick={() => router.back()} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="font-medium mx-auto">Product Details</span>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {!product ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Loading Product {decodeURIComponent(productId)}...</p>
                </div>
            ) : (
                <div className="pb-24">
                    {/* Product Image */}
                    <div className="w-full aspect-square bg-muted"></div>

                    {/* Product Info */}
                    <div className="p-4">
                        <h2 className="text-xl font-bold">Product Title</h2>
                        <p className="text-primary font-bold mt-1">$0.00</p>

                        <Button className="w-full mt-4 rounded-md h-12" onClick={() => router.push('/view-in-room')}>
                            View in my room
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
