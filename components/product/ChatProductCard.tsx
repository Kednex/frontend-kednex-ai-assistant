import React, { memo } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

    return (
        <Card
            className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                    <div className="text-sm font-bold text-primary">
                        {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
                    </div>
                )}

                {/* Imersian Visualiser Trigger SKU */}
                <input type="hidden" className="imersian-variant-sku" value={product.id} />

                {onViewInRoom && (
                    <Button
                        variant="default"
                        className="h-8 w-full text-xs rounded-full mt-2 imersian-view-in-room"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewInRoom(product);
                        }}
                    >
                        View in my room
                    </Button>
                )}
            </CardContent>
        </Card>
    );
});
