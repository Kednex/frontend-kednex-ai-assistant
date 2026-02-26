import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

interface UseProductSearchParams {
    query: string;
    first?: number;
    minQueryLength?: number;
}

export function useProductSearch({ query, first = 14, minQueryLength = 1 }: UseProductSearchParams) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchProducts = async () => {
        if (!query || query.length < minQueryLength) {
            setProducts([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // TODO: Create a new API endpoint for product search. use Redux?
            const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&first=${first}`);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products || []);
        } catch (err: any) {
            console.error('[useProductSearch] Error fetching products:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [query, first, minQueryLength]);

    return {
        products,
        loading,
        error,
        refetch: fetchProducts,
    };
}
