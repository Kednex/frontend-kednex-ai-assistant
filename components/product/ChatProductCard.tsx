'use client';

import React, { memo } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/lib/store/hooks";
import { RootState } from "@/lib/store/store";

type ChatProductCardProps = {
    product: Product;
    onViewInRoom?: (product: Product) => void;
    onOpenProduct?: (product: Product) => void;
};

export const ChatProductCard = memo(function ChatProductCard({
    product,
    onViewInRoom,
    onOpenProduct,
}: ChatProductCardProps) {
    const imageUrl = product.featuredImage?.url || "/placeholder.png";
    const NEXT_PUBLIC_VISUALIZER_URL = process.env.NEXT_PUBLIC_VISUALIZER_URL || "notcatched";
    const designId = useAppSelector((state: RootState) => state.visualiser.designId);
    const userUuid = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('userUuid') || ''
        : '';
    const firstVariantId = (product.variants as any)?.[0]?.id || "notcatched";

    return (
        <Card
            className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-[var(--radius)] font-sans"
            onClick={() => onOpenProduct?.(product)}
        >
            <div className="relative aspect-square bg-muted">
                {product.featuredImage?.url ? (
                    <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                    </div>
                )}
                {/* Custom Favorite Button Could go here in the future */}
            </div>
            <CardContent className="p-3 flex flex-col gap-1">
                <div className="text-sm font-medium line-clamp-2">{product.title}</div>
                {product.priceRange && (
                    <div className="text-sm font-bold">
                        {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
                    </div>
                )}

                {/* Imersian Visualiser Trigger SKU */}
                <input type="hidden" className="imersian-variant-sku" value={product.id} />

                {onViewInRoom && (
                    <Button
                        variant="default"
                        className="h-8 w-full text-xs rounded-[var(--radius)] mt-2 imersian-view-in-room cursor-pointer"
                        
                        onClick={(e) => {

                            console.log(`[ChatProductCard] View in Room clicked for design ID: ${designId}, variant ID: ${firstVariantId}`); //check the design id and variant id are correct

                            e.stopPropagation();
                            const url = `${NEXT_PUBLIC_VISUALIZER_URL}userUuid=${userUuid}&designId=${designId}&sku=${firstVariantId}`;
                            window.open(url, '_blank');
                        }}
                        
                    >
                        View in my room
                    </Button>
                )}
            </CardContent>
        </Card>
    );
});
