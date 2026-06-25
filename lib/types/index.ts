import type { UIMessage as AIMessage } from 'ai';

// Simplified product types
export type Product = {
    id: string;
    title: string;
    descriptionHtml?: string;
    handle: string;
    vendor: string;
    publishedAt?: string;
    createdAt?: string;
    featuredImage?: {
        url: string;
        altText?: string;
    };
    priceRange?: {
        minVariantPrice: Price;
        maxVariantPrice: Price;
    };
    variants?: {
        edges: {
            node: ProductVariant;
        }[];
    };
};

export type ProductVariant = {
    id: string;
    sku?: string;
    title: string;
    availableForSale?: boolean;
    price?: Price;
    image?: {
        url: string;
        altText?: string;
    };
};

export type Price = {
    amount: string;
    currencyCode: string;
};

// Domain
export type Category = {
    name: string;
    id: string;
    imageUrl?: string;
    icon?: React.ReactNode;
};

export type RoomContext = {
    roomId: string;
    imageUrl: string;
    createdAt: number;
};

export type Message = AIMessage & {
    attachments?: string[];
    searchPayload?: any;
    isError?: boolean;
};

export type ChatSession = {
    sessionId: string;
    category: string;
    messages: Message[];
    timestamp: number;
    contextUploads?: RoomContext[];
    genContent?: GeneratedContent[];
    previousResponseId?: string | null;
    designId?: string | null; // 3D reconstructed-room reference, needed to restore the visualiser
    userUuid?: string; // Associate sessions with users
};

export type GeneratedContent = {
    room: RoomContext;
    imageUrl: string;
    createdAt: number;
    productId: string;
    productTitle: string;
    category: string;
    variantId?: string;
    sessionId?: string;
};

export type PreviewImage = {
    id: string;
    file: File;
    previewUrl: string; // blob URL, UI only
};

export type ChatIntentType = "new" | "restore" | "resume" | "unknown";

export interface ChatIntent {
    type: ChatIntentType;
    // For new-chat
    sessionId?: string; // Mandatory when type is "new"
    initialCategory?: string;
    initialRooms?: RoomContext[];
    // For restore-chat
    sessionToRestore?: ChatSession;
}
