import { generateUUID } from '@/lib/utils/uuid';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { getMerchantThemeSample } from './merchant-sample';

async function resolveMerchantInfo(userUuid: string) {
    // TODO: replace with backend fetch once schema is ready

    // // fetch merchant info from backend
    // if (!userUuid) {
    //     return new Response(JSON.stringify({ error:'Missing userUuid parameter' }), { status: 400 });
    // }

    // const Backend = process.env.BackEnd || 'http:/localhost:4000';
    // const response = await fetch(`${Backend}/merchantinfo/${userUuid}`);

    // if (!response.ok) {
    //     throw new Error(`Backend error: ${responsestatus}`);
    // }

    // const merchantInfo = await response.json();
    // if (!merchantInfo) {
    //     return new Response(JSON.stringify({ error:'Unknown userUuid' }), { status: 404 });
    // }

    // return new Response(JSON.stringify(merchantInfo), {status: 200 });    


    return getMerchantThemeSample(userUuid);
}

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
            sku:            v.variant_sku ?? v.variantSku ?? v.sku ?? '',
            title:          v.title ?? '',
            availableForSale: v.available ?? true,
            price:          { amount: String(v.price ?? '0'), currencyCode: v.currency ?? 'USD' },
            image:          v.image_url ? { url: v.image_url } : null,
        })),
    };
}

// chat endpoint for handling chat messages from the frontend, forwarding to Imersian backend, and streaming responses back to UI
export async function POST(req: Request) {
    try {
        const { messages, category, rooms, sessionId, previousResponseId, attachments, userUuid } = await req.json();

        // merchant informations
        const merchantInfo = userUuid ? await resolveMerchantInfo(userUuid) : undefined;
        const fallbackResponse = merchantInfo?.aiAssistant?.rules?.fallbackResponse?.trim() || 'Sorry, I had trouble processing that. Can you please try again later?';


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

        

        const API_BASE = process.env.BackEnd || 'http://localhost:4000';
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

                                }else if(parsed.chunk === '___ANALYSING_ROOM___') {
                                    // Room analysis started — send as a data event, NOT as visible text
                                    (dataStream as any).write({
                                        type: 'data-roomAnalysis',
                                        data: { status: 'analysing' }
                                    });
                                }else if(parsed.chunk === '___DETECTED_ROOM_LAYOUT___') {
                                    // Room layout detected — send as a data event, NOT as visible text
                                    (dataStream as any).write({
                                        type: 'data-roomAnalysis',
                                        data: { status: 'detected' }
                                    });
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

                if (!fullText.trim() && fallbackResponse) {
                    fullText = fallbackResponse;
                    dataStream.write({
                        type: 'text-delta',
                        id: messageId,
                        delta: fallbackResponse,
                    });
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

// chat endpoint for fetching merchant information from backend to apply theming based on merchant's primary color
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userUuid = searchParams.get('userUuid') || '';




        // fetch merchant info
        if (!userUuid) {
            return new Response(JSON.stringify({ error: 'Missing userUuid parameter' }), { status: 400 });
        }

        const merchantInfo = await resolveMerchantInfo(userUuid);
        if (!merchantInfo) {
            return new Response(JSON.stringify({ error: 'Unknown userUuid' }), { status: 404 });
        }

        return new Response(JSON.stringify(merchantInfo), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}