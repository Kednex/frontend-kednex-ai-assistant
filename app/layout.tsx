import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono, Roboto } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import MerchantTheme from "./merchant-theme";
import { ThemeProvider } from "./theme-context";
import { ThemeWrapper } from "./theme-wrapper";
import { ImersianInitializer } from "@/components/ImersianInitializer";
import { Providers } from "./providers";

// const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imersian AI Assistant",
  description: "An AI assistant for furniture shopping and interior design, powered by Imersian's 3D product data and visualisation technology.",
};

// Resize the layout (not just the visual viewport) when the mobile keyboard
// opens, so the composer and h-dvh layout reflow instead of hiding behind it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en" className={roboto.variable}>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <ImersianInitializer />
        <ThemeProvider>
          <MerchantTheme />
          <ThemeWrapper>
            <Providers>
              {children}
            </Providers>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
