"use client";

import { useState, useCallback } from "react";
import { ChatInterface } from "../components/chat/ChatInterface";
import StoreProvider from "../lib/store/StoreProvider";
import { IntroProvider, useIntroContext } from "../lib/store/IntroContext";
import IntroPage from "./intro/[step]/page";
import type { PreviewImage } from "@/lib/types";

function HomeContent() {
  const [showChat, setShowChat] = useState(false);
  const { setUploadedImages } = useIntroContext();

  const handleIntroComplete = useCallback((images: PreviewImage[]) => {
    // Store images in context so they're available to ChatInput
    setUploadedImages(images);
    setShowChat(true);
  }, [setUploadedImages]);

  return (
    <StoreProvider>
      <main>
        {showChat ? (
          <ChatInterface />
        ) : (
          <IntroPage
            params={Promise.resolve({ step: "1" })}
            onComplete={(images) => handleIntroComplete(images)}
          />
        )}
      </main>
    </StoreProvider>
  );
}

export default function Home() {
  return (
    <IntroProvider>
      <HomeContent />
    </IntroProvider>
  );
}
