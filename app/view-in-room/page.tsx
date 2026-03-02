"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ViewInRoomLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const sku = searchParams.get('sku');
    const userUuid = searchParams.get('userUuid');
    const roomId = searchParams.get('roomId');

    useEffect(() => {
        // This route acts as a bridge to the Visualiser
        // It consumes context from the Assistant and hands it over to the Visualiser application.
        console.log(`[ViewInRoomBridge] Handing over to Visualiser: SKU=${sku}, User=${userUuid}, Room=${roomId}`);

        // In a production implementation, this would likely open the visualiser in a new window or a global modal.
        // For the standalone POC, we simulate the handover.
        const timer = setTimeout(() => {
            alert(`Handing over to Visualiser:\nProduct SKU: ${sku}\nMerchant: ${userUuid}\nRoom ID: ${roomId || 'None'}`);
            router.push('/chat');
        }, 1500);

        return () => clearTimeout(timer);
    }, [sku, userUuid, roomId, router]);

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
