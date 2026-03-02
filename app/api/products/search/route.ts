import { NextResponse } from 'next/server';

const MOCK_PRODUCTS = [
    {
        id: "prod-rug-001",
        title: "Handwoven Vintage Turkish Rug",
        description: "A beautiful handwoven rug featuring traditional Anatolian motifs. The distressed finish adds character, making it perfect for rustic or boho chic interiors.",
        featuredImage: { url: "https://images.unsplash.com/photo-1579273166629-ee1c259837a2?auto=format&fit=crop&q=80&w=800", altText: "Turkish Rug" },
        priceRange: { minVariantPrice: { amount: "299.00", currencyCode: "USD" } }
    },
    {
        id: "prod-rug-002",
        title: "Modern Geometric Wool Rug",
        description: "A plush wool rug with a clean geometric pattern. Ideal for contemporary living spaces.",
        featuredImage: { url: "https://images.unsplash.com/photo-1596773344605-db439dce1c02?auto=format&fit=crop&q=80&w=800", altText: "Geometric Rug" },
        priceRange: { minVariantPrice: { amount: "350.00", currencyCode: "USD" } }
    },
    {
        id: "prod-furn-001",
        title: "Mid-Century Modern Sofa",
        description: "A sleek three-seater sofa covered in velvet. Deep cushions ensure exceptional comfort.",
        featuredImage: { url: "https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800", altText: "Mid-Century Sofa" },
        priceRange: { minVariantPrice: { amount: "899.00", currencyCode: "USD" } }
    },
    {
        id: "prod-furn-002",
        title: "Solid Wood Coffee Table",
        description: "Crafted from walnut, this coffee table features organic curves and a spacious lower shelf.",
        featuredImage: { url: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800", altText: "Wooden Coffee Table" },
        priceRange: { minVariantPrice: { amount: "250.00", currencyCode: "USD" } }
    }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    console.log(`[API] Searching products for query: ${query}`);

    const filteredProducts = query
        ? MOCK_PRODUCTS.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
        : MOCK_PRODUCTS;

    return NextResponse.json({
        products: filteredProducts.length > 0 ? filteredProducts : MOCK_PRODUCTS,
        message: "Using mock product data for functioning UI",
    });
}
