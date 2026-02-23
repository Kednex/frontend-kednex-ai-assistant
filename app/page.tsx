import { ChatInterface } from "../components/chat/ChatInterface";
import StoreProvider from "../lib/store/StoreProvider";

export default function Home() {
  return (
    <StoreProvider>
      <main>
        <ChatInterface />
      </main>
    </StoreProvider>
  );
}
