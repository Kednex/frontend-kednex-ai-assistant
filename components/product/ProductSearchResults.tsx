"use client";

import { useState, useMemo, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { ChatProductCard } from "./ChatProductCard";
import type { RoomContext, ChatSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useProductSearch } from "@/hooks/useProductSearch";

type ProductSearchResultsProps = {
    searchPayload?: any;
    rooms?: RoomContext[];
    category: string;
    getChatSession?: () => ChatSession;
    onProductSelect?: (product: Product, variant?: any) => void;
    cachedProducts?: Product[];
};

export const ProductSearchResults = memo(function ProductSearchResults({
    searchPayload,
    rooms = [],
    category,
    getChatSession,
    onProductSelect,
    cachedProducts,
}: ProductSearchResultsProps) {
    const router = useRouter();
    const query = searchPayload?.query || "";
    const [visibleCount, setVisibleCount] = useState(6);

    const memoParams = useMemo(() => ({
        query,
        first: 14,
        minQueryLength: 1,
    }), [query]);

    // Use the newly created custom API hook
    const { products: fetchedProducts, loading: fetching, error, refetch } = useProductSearch(memoParams);

    const products = cachedProducts ?? fetchedProducts;
    const loading = !cachedProducts && fetching;

    useEffect(() => {
        if (error && error.message?.includes("timed out")) {
            // toast.error("Product search timed out. Please try again.");
        }
    }, [error, refetch]);

    // Navigate to product details 
    const navigateToProduct = async (product: Product) => {
        const encodedProductId = encodeURIComponent(product.id);
        // TODO: Store context somewhere (Redux) since we don't have react-router location state
        router.push(`/product/${encodedProductId}`);
    };

    const navigateToViewInRoom = (product: Product) => {
        if (onProductSelect) {
            onProductSelect(product);
            return;
        }

        // The imersian-visualiser launch is now handled by the Imersian JS bundle
        // which intercepts clicks on elements with the 'imersian-view-in-room' class
        // and reads the SKU from the 'imersian-variant-sku' hidden input.
        console.log(`[Assistant] Triggering Visualiser wiring for SKU: ${product.id}`);
    };

    if (loading && !products?.length) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                Loading recommendations…
            </div>
        );
    }

    if (error && !products?.length) {
        return (
            <div className="p-4 text-center text-sm text-destructive">
                Unable to load recommendations. {error.message}
            </div>
        );
    }

    if (!products || products.length === 0) {
        if (loading) return null;
        if (!query) return null;
        return (
            <div className="p-4 text-center text-sm text-muted-foreground italic">
                No specific products found for "{query}".
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center flex-1">
                    Recommended Products
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {products.slice(0, visibleCount).map((product: Product) => (
                    <ChatProductCard
                        key={product.id}
                        product={product}
                        onViewInRoom={navigateToViewInRoom}
                        onOpenProduct={navigateToProduct}
                    />
                ))}
            </div>

            {products.length > visibleCount && (
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        setVisibleCount((v) => v + 4);
                    }}
                    className="mt-4 py-3 w-full rounded-xl"
                >
                    Show more ({products.length - visibleCount})
                </Button>
            )}
        </div>
    );
});

export default ProductSearchResults;
