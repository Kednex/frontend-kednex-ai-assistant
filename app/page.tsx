"use client";

import { useState } from "react";
import { ChatInterface } from "../components/chat/ChatInterface";
import StoreProvider from "../lib/store/StoreProvider";

import IntroPage from "./intro/[step]/page";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  return (
    <StoreProvider>
      <main>
        {showChat ? (
          <ChatInterface />
        ) : (
          <IntroPage
            params={Promise.resolve({ step: "1" })}
            onComplete={() => setShowChat(true)}
          />
        )}
      </main>
    </StoreProvider>
  );
}
