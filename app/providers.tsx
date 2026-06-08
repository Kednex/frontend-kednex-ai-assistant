'use client';

import StoreProvider from '@/lib/store/StoreProvider';
import { IntroProvider } from '@/lib/store/IntroContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <StoreProvider>
            <IntroProvider>
                {children}
            </IntroProvider>
        </StoreProvider>
    );
}
