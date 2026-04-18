'use client';

import React, { memo } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/lib/store/hooks";
import { RootState } from "@/lib/store/store";
import { useImersianClient } from "@/hooks/useImersianClient";

type ChatProductCardProps = {
    product: Product;
    onViewInRoom?: (product: Product) => void;
    onOpenProduct?: (product: Product) => void;
};

function normalizeVisualiserSku(sku?: string): string {
    if (!sku) {
        return "";
    }

    const trimmed = sku.trim();
    if (trimmed.startsWith("gid://")) {
        const segments = trimmed.split("/");
        return segments[segments.length - 1] || "";
    }

    return trimmed;
}

export const ChatProductCard = memo(function ChatProductCard({
    product,
    onViewInRoom,
    onOpenProduct,
}: ChatProductCardProps) {
    const imageUrl = product.featuredImage?.url || "/placeholder.png";
    const NEXT_PUBLIC_VISUALIZER_URL = process.env.NEXT_PUBLIC_VISUALIZER_URL || "notcatched";
    const designId = useAppSelector((state: RootState) => state.visualiser.designId);
    const { openVisualiser } = useImersianClient(); //load visualiser client and function to open it

    const userUuid = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('userUuid') || ''
        : '';

    const variantNodes = Array.isArray(product.variants)
        ? product.variants
        : (product.variants?.edges ?? []).map((edge: any) => edge?.node).filter(Boolean);

    const firstVariant = variantNodes[0] as any;
    const firstVariantId = firstVariant?.id || "";
    const firstVariantSku = firstVariant?.sku || "";
    const visualiserSku = normalizeVisualiserSku(firstVariantSku || firstVariantId);

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
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                <input type="hidden" className="imersian-variant-sku" value={visualiserSku} />

                {/* console.log(`[ChatProductCard] Visualiser SKU: {visualiserSku}`); */}

                {onViewInRoom && (
                    <Button
                        variant="default"
                        className="h-8 w-full text-xs rounded-[var(--radius)] mt-2 imersian-view-in-room cursor-pointer"
                        
                        onClick={async (e) => {
                            e.stopPropagation();

                            console.log(
                                `[ChatProductCard] View in Room clicked | designId=${designId} | variantId=${firstVariantId} | variantSku=${firstVariantSku} | visualiserSku=${visualiserSku}`,
                            );

                            // const result = await openVisualiser(visualiserSku, {
                            //     userUuid: userUuid || undefined,
                            //     designId: designId || "1",
                            // });

                            const result = await openVisualiser(visualiserSku, {
                                userUuid: userUuid || undefined,
                                designId: designId || "1",
                            });

                            if (result.ok) {
                                onViewInRoom?.(product);
                                return;
                            }

                            const fallbackMessage = "Imersian visualiser is temporarily unavailable. Opening fallback page in a new tab.";
                            console.warn(`[ChatProductCard] ${fallbackMessage} Reason: ${result.message}`);
                            window.alert(fallbackMessage);

                            // const url = `${NEXT_PUBLIC_VISUALIZER_URL}userUuid=${userUuid}&designId=${designId}&sku=${visualiserSku}`;
                            // window.open(url, "_blank");
                            // onViewInRoom?.(product);
                        }}
                        
                    >
                        View in my room
                    </Button>
                )}
            </CardContent>
        </Card>
    );
});
