import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export async function POST(req: Request) {
    try {
        const { messages, category, rooms, sessionId } = await req.json();

        // AI SDK 6.0 uses 'parts'. We extract text from the latest message.
        const latestMessage = messages[messages.length - 1];
        let latestText = '';

        if (Array.isArray(latestMessage.parts)) {
            latestText = latestMessage.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join(' ');
        } else {
            // Fallback for older formats or unexpected input
            latestText = latestMessage.content || '';
        }

        // Construct payload for Imersian backend
        const backendParts: any[] = [
            { type: "text", text: latestText }
        ];

        if (rooms && rooms.length > 0) {
            rooms.forEach((url: string) => {
                backendParts.push({
                    type: "file",
                    url,
                    name: "room.png",
                    mediaType: "image/png"
                });
            });
        }

        const payload = {
            message: { parts: backendParts },
            selectedChatModel: "chat-model",
            selectedVisibilityType: "public",
            sessionId
        };

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.imersian.com/api/v1';
        const endpoint = `${API_BASE}/chat/shopify/${category ? category.replace(/\s+/g, "") : "default"}`;

        const stream = createUIMessageStream({
            async execute({ writer }) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'text/event-stream'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`Imersian API error: ${response.status}`);
                    }

                    if (!response.body) {
                        writer.write({ type: 'error', errorText: 'No response body from Imersian API' });
                        return;
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lastNewline = buffer.lastIndexOf("\n");

                        if (lastNewline !== -1) {
                            const chunkToProcess = buffer.slice(0, lastNewline);
                            buffer = buffer.slice(lastNewline + 1);

                            const lines = chunkToProcess.split("\n");
                            for (const line of lines) {
                                if (!line.startsWith("data:")) continue;
                                const dataStr = line.slice(5).trim();

                                if (!dataStr || dataStr === "[DONE]") continue;

                                try {
                                    const obj = JSON.parse(dataStr);

                                    // Use backend's responseId or messageId if available
                                    const id = obj.responseId || obj.messageId || `msg-${Date.now()}`;

                                    // Pass Imersian-specific structured data using AI SDK data parts
                                    if (obj.responseId) {
                                        writer.write({ type: 'data-responseId' as any, data: obj.responseId, id });
                                    }
                                    if (obj.type === "search-payload") {
                                        writer.write({ type: 'data-searchPayload' as any, data: obj.searchPayload, id });
                                    }

                                    // Write the actual text delta
                                    const content = obj.delta ?? obj.content ?? "";
                                    if (content) {
                                        writer.write({ type: 'text-delta', delta: content, id });
                                    }
                                } catch {
                                    // Fallback if not JSON
                                    writer.write({ type: 'text-delta', delta: dataStr, id: `msg-${Date.now()}` });
                                }
                            }
                        }
                    }
                } catch (error: any) {
                    writer.write({ type: 'error', errorText: error.message || 'Stream processing failed' });
                }
            }
        });

        return createUIMessageStreamResponse({ stream });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
