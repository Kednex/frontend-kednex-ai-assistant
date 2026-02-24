"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ViewInRoomLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    const productId = searchParams.get('productId');

    useEffect(() => {
        // This route acts as a bridge to the Visualiser
        // Instead of rendering a standalone page like in shop-minis, we redirect or trigger state changes
        console.log(`[ViewInRoomBridge] Triggering Visualiser launch for room ${roomId} and product ${productId}`);

        // For now we simulate integration by bouncing back to home/chat 
        // TODO: Actually open the Visualiser modal or trigger its Redux action
        setTimeout(() => {
            alert(`Connecting to Visualiser: Loading Room ${roomId} & Product ${productId}`);
            router.push('/chat');
        }, 1500);

    }, [roomId, productId, router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground animate-pulse font-medium">Launching Imersian Visualiser...</p>
        </div>
    );
}

export default function ViewInRoomPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
            </div>
        }>
            <ViewInRoomLogic />
        </Suspense>
    );
}
