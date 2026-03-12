import { generateUUID } from '@/lib/utils/uuid';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { use } from 'react';

// Normalise the raw Shopify MCP product shape → frontend Product type
function normalizeMcpProduct(p: any) {
    return {
        id:    p.product_id ?? p.id ?? '',
        title: p.title ?? '',
        handle: p.handle ?? '',
        vendor: p.vendor ?? '',
        featuredImage: p.image_url
            ? { url: p.image_url, altText: p.image_alt_text ?? p.title ?? '' }
            : (p.featuredImage ?? null),
        priceRange: p.price_range
            ? {
                minVariantPrice: { amount: String(p.price_range.min ?? '0'), currencyCode: p.price_range.currency ?? 'USD' },
                maxVariantPrice: { amount: String(p.price_range.max ?? '0'), currencyCode: p.price_range.currency ?? 'USD' },
              }
            : (p.priceRange ?? null),
        variants: (p.variants ?? []).map((v: any) => ({
            id:             v.variant_id ?? v.id ?? '',
            title:          v.title ?? '',
            availableForSale: v.available ?? true,
            price:          { amount: String(v.price ?? '0'), currencyCode: v.currency ?? 'USD' },
            image:          v.image_url ? { url: v.image_url } : null,
        })),
    };
}

export async function POST(req: Request) {
    try {
        const { messages, category, rooms, sessionId, previousResponseId, attachments, userUuid } = await req.json();


        //log the incoming request for debugging
        console.log("Received chat request from UI:", { messages, category, rooms, sessionId, previousResponseId, attachments });

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

        // Log the extracted text for debugging
        console.log("Extracted latest text from message:", latestText);

        // Map URL strings to the Attachment shape MerchantChatService expects
        const attachmentObjects = Array.isArray(attachments) && attachments.length > 0
            ? attachments.map((url: string) => ({
                type: "file" as const,
                url,
                name: "room.png",
                mediaType: "image/png",
            }))
            : undefined;

        const payload = {
            message: latestText,
            previousResponseId: previousResponseId || null,
            sessionId,
            attachments: attachments || [],
            userUuid: userUuid || "",

        };

        // debug payload
        console.log("payload : ", payload);

        

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        // const endpoint = `${API_BASE}/chat/merchant/rug`;

        const backendResponse = await fetch(`${API_BASE}/chat/merchant/rug`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status}`);
        }

        const stream = createUIMessageStream({
            async execute({ writer: dataStream }) {
                const messageId = generateUUID();
                let fullText = '';
                let responseId = '';
                let products: any[] = [];
                let designID = '';

                dataStream.write({
                    type: 'text-start',
                    id: messageId,
                    providerMetadata: undefined
                });

                // Read the SSE stream from backend
                const reader = backendResponse.body?.getReader();
                const decoder = new TextDecoder();

                if (reader) {
                    while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.chunk) {
                                if (parsed.chunk.startsWith('___RESPONSE_ID___')) {
                                    responseId = parsed.chunk.replace('___RESPONSE_ID___', '').replace('___', '');
                                }else if(parsed.chunk.startsWith('___DESIGN_ID___')) {
                                    designID = parsed.chunk.replace('___DESIGN_ID___', '').replace('___', '');
                                }else if(parsed.chunk.startsWith('___PRODUCTS___')) {
                                    const match = parsed.chunk.match(/___PRODUCTS___([\s\S]*?)___END_PRODUCTS___/);
                                    if (match) {
                                        try { products = JSON.parse(match[1]); } catch {}
                                    }
                                
                                }else {
                                    fullText += parsed.chunk;
                                    // Stream each chunk to frontend
                                    dataStream.write({
                                    type: 'text-delta',
                                    id: messageId,
                                    delta: parsed.chunk
                                    });
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                        }
                    }
                    }
                }

                dataStream.write({
                    type: 'text-end',
                    id: messageId
                });

                console.log('🔑 Extracted responseId from backend:', responseId);

                console.log('🔑 Extracted designId from backend:', designID); // design id extracted from backend

                // Send response ID and products (normalised to frontend Product type)
                dataStream.write({
                    type: 'data-usage',
                    id: messageId,
                    data: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    responseId: responseId,
                    designId: designID,
                    products: products.map(normalizeMcpProduct)
                    }
                });
                
                console.log('✅ Sent data-usage event | responseId:', responseId, '| products:', products.length);
                console.log('Products:', products[0]);
            },
            generateId: generateUUID,
        });

        return new Response(stream.pipeThrough(new JsonToSseTransformStream()));

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}



// export async function POST(req: Request) {
//     try {
//         const { messages, category, rooms, sessionId } = await req.json();

//         //log the incoming request for debugging
//         console.log("Received chat request from UI:", { messages, category, rooms, sessionId });

//         // AI SDK 6.0 uses 'parts'. We extract text from the latest message.
//         const latestMessage = messages[messages.length - 1];
//         let latestText = '';

//         if (Array.isArray(latestMessage.parts)) {
//             latestText = latestMessage.parts
//                 .filter((p: any) => p.type === 'text')
//                 .map((p: any) => p.text)
//                 .join(' ');
//         } else {
//             // Fallback for older formats or unexpected input
//             latestText = latestMessage.content || '';
//         }

//         // Log the extracted text for debugging
//         console.log("Extracted latest text from message:", latestText);

//         // Construct payload for Imersian backend
//         const backendParts: any[] = [
//             { type: "text", text: latestText }
//         ];

//         if (rooms && rooms.length > 0) {
//             rooms.forEach((url: string) => {
//                 backendParts.push({
//                     type: "file",
//                     url,
//                     name: "room.png",
//                     mediaType: "image/png"
//                 });
//             });
//         }

//         const payload = {
//             message: { parts: backendParts },
//             selectedChatModel: "chat-model",
//             selectedVisibilityType: "public",
//             sessionId
//         };


//         // debug payload
//         console.log("payload : ", payload);

//         const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.imersian.com/api/v1';
//         const endpoint = `${API_BASE}/chat/${category ? category.replace(/\s+/g, "") : "default"}`;


//         const stream = createUIMessageStream({
//             async execute({ writer }) {
//                 try {
//                     const response = await fetch(endpoint, {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Accept': 'text/event-stream'
//                         },
//                         body: JSON.stringify(payload)
                        
//                     });

//                     if (!response.ok) {
//                         throw new Error(`Imersian API error: ${response.status}`);
//                     }

//                     if (!response.body) {
//                         writer.write({ type: 'error', errorText: 'No response body from Imersian API' });
//                         return;
//                     }

//                     const reader = response.body.getReader();
//                     const decoder = new TextDecoder("utf-8");
//                     let buffer = "";

//                     while (true) {
//                         const { value, done } = await reader.read();
//                         if (done) break;

//                         buffer += decoder.decode(value, { stream: true });
//                         const lastNewline = buffer.lastIndexOf("\n");

//                         if (lastNewline !== -1) {
//                             const chunkToProcess = buffer.slice(0, lastNewline);
//                             buffer = buffer.slice(lastNewline + 1);

//                             const lines = chunkToProcess.split("\n");
//                             for (const line of lines) {
//                                 if (!line.startsWith("data:")) continue;
//                                 const dataStr = line.slice(5).trim();

//                                 if (!dataStr || dataStr === "[DONE]") continue;

//                                 try {
//                                     const obj = JSON.parse(dataStr);

//                                     // Use backend's responseId or messageId if available
//                                     const id = obj.responseId || obj.messageId || `msg-${Date.now()}`;

//                                     // Pass Imersian-specific structured data using AI SDK data parts
//                                     if (obj.responseId) {
//                                         writer.write({ type: 'data-responseId' as any, data: obj.responseId, id });
//                                     }
//                                     if (obj.type === "search-payload") {
//                                         writer.write({ type: 'data-searchPayload' as any, data: obj.searchPayload, id });
//                                     }

//                                     // Write the actual text delta
//                                     const content = obj.delta ?? obj.content ?? "";
//                                     if (content) {
//                                         writer.write({ type: 'text-delta', delta: content, id });
//                                     }
//                                 } catch {
//                                     // Fallback if not JSON
//                                     writer.write({ type: 'text-delta', delta: dataStr, id: `msg-${Date.now()}` });
//                                 }
//                             }
//                         }
//                     }
//                 } catch (error: any) {
//                     writer.write({ type: 'error', errorText: error.message || 'Stream processing failed' });
//                 }
//             }
//         });

//         return createUIMessageStreamResponse({ stream });

//     } catch (error: any) {
//         return new Response(JSON.stringify({ error: error.message }), { status: 500 });
//     }
// }
