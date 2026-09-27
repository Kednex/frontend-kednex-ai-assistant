// import OpenAI from "openai";
// import { getAssistantPromptByAssistantType } from "./MerchantAssistantPromptBuilder";

// const openAiClient = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export interface Attachment {
//   type: "file";
//   base64Imge: string;
//   name: string;
//   mediaType: string;
// }

// export interface MerchantChatRequestAlgolia {
//   userUuid: string;
//   message: string;
//   attachments?: Attachment[];
//   previousResponseId?: string;
//   searchPage?: number;
// }

// export interface MerchantChatResponse {
//   response: string;
//   responseId: string;
//   timestamp: string;
//   conversationId?: string;
// }

// export class MerchantChatServiceAlgolia {
//   private storeDomain: string;
//   private merchantInfo: any;
//   private currencySymbol: string;

//   constructor(merchantInfo:any) {
//     this.merchantInfo = merchantInfo;
//     this.storeDomain = merchantInfo.shopifyUrl;
//     this.currencySymbol = merchantInfo.currencySymbol || "$";
//     console.log("MerchantChatServiceAlgolia initialized with store domain:", merchantInfo);
//     console.log("Merchant Info: currencySymbol:", this.currencySymbol);
//   }

//   async *processMerchantChatStream(chatRequest: MerchantChatRequestAlgolia, assistantType: string): AsyncGenerator<string, void, unknown> {
//     try {
//       console.log("previousResponseId:", chatRequest.previousResponseId);

//       let newResponseId = "";
//       let designID = "";

//       const assistantPrompt = getAssistantPromptByAssistantType(assistantType, this.storeDomain, this.merchantInfo, this.currencySymbol);
//       // Only include the system prompt on the first turn.
//       // With previous_response_id, OpenAI already carries the full history server-side —
//       // re-sending the system message every turn duplicates it in the chain, rapidly
//       // filling the context window and causing early turns to be dropped.
//       const input: Array<any> = chatRequest.previousResponseId ? [] : [{ role: "system", content: assistantPrompt }];

//       // filter instructions
//       const searchPage = chatRequest.searchPage ?? 0;
//       const filterInstruction = `[REQUIRED ALGOLIA SEARCH PARAMETERS - use these exact values in every tool call, do not change them]
//       facet_userUuid: ["${chatRequest.userUuid}"]
//       facet_status: ["ACTIVE"]
//       hitsPerPage: 6`;

//       // Add current user message (with or without images)
//       if (chatRequest.attachments && chatRequest.attachments.length > 0) {
//         console.log("Adding attachments to chat input:", chatRequest.attachments.length);
//         yield `___ANALYSING___`;
//         yield `___DETECTED_LAYOUT___`;

//         const content: Array<any> = [];

//         chatRequest.attachments.forEach((att) => {
//           content.push({
//             type: "input_image",
//             image_url: `data:image/jpeg;base64,${att.base64Imge}`, // this only work for jpg images.
//           });
//         });

//         content.push({
//           type: "input_text",
//           text: `User request: ${chatRequest.message}`,
//         });

//         input.push({
//           type: "message",
//           role: "user",
//           content,
//         });
//       } else {
//         console.log("Adding text-only message to chat input");
//         input.push({
//           type: "message",
//           role: "user",
//           content: `User request: ${chatRequest.message}`,
//         });
//       }

//       let stream: any;
//       let tools: Array<any> = [];

//       if (assistantType === "rag") {
//         console.log("Rug assistant selected, preparing input with filter instructions");
//         // tools = [
//         //   // Algolia MCP tool
//         //   {
//         //     type: "mcp",
//         //     server_label: "algolia_mcp",
//         //     server_url: "https://CZTE2A2H8S.algolia.net/mcp/1/JPUCDGkqR3CdP6hpt6vkZw/mcp",
//         //     allowed_tools: [
//         //       // "search",
//         //       "algolia_search_index_prod-rugs",
//         //     ],
//         //     require_approval: "never",
//         //   },
//         // ];
//       }

//       // File search tool for FAQ vector store (only when a vectorDBKey is configured)
//       if (this.merchantInfo.vectorDBKey) {
//         tools.push({
//           type: "file_search",
//           vector_store_ids: [`${this.merchantInfo.vectorDBKey}`],
//         });
//       }

//       // Create streaming response
//       stream = await openAiClient.responses.create({
//         model: "gpt-5.4-mini",
//         previous_response_id: chatRequest.previousResponseId,
//         input: input,
//         tools: tools,
//         temperature: 0.7,
//         max_output_tokens: 4096,
//         store: true,
//         stream: true
//       });

//       // Yield chunks as they come
//       for await (const chunk of stream) {
//         // Debug log
//         console.log("Event type:", chunk.type);

//         // Use response.output_text.delta
//         if (chunk.type === "response.output_text.delta") {
//           yield chunk.delta;
//         }

//         // Store the response ID when done
//         if (chunk.type === "response.completed") {
//           yield `___RESPONSE_ID___${chunk.response.id}___`;
//           newResponseId = chunk.response.id;
//           console.log("new response id:", newResponseId);

//           // Extract MCP tool outputs from the output items
//         //   for (const item of chunk.response.output) {
//         //     if (item.type === "mcp_call" && item.output) {
//         //       console.log("🔧 RAW MCP item.output (first 500 chars):", String(item.output).slice(0, 500));
//         //       const toolOutput = JSON.parse(item.output);
//         //       console.log("🔧 toolOutput keys:", Object.keys(toolOutput));

//         //       // Algolia MCP returns products in a consistent "hits" array
//         //       // const products: any[] = toolOutput.hits || [];
//         //       const RawProducts: any[] = (toolOutput.hits ?? toolOutput.results?.[0]?.hits ?? []).map((hit: any) => ({
//         //         ...hit,
//         //         id: hit.objectID ?? hit.id, // ← normalize to what frontend expects
//         //       }));

//         //       // send through product transformer
//         //       const products = transformAlgoliaMCPOutputToProducts(RawProducts, this.currencySymbol);

//         //       // console.log('🛍️ Products extracted:', products.length);
//         //       console.log("🛍️ Products:", products[0]);
//         //       yield `___PRODUCTS___${JSON.stringify(products)}___END_PRODUCTS___`;
//         //       // Tell the frontend what page was used so it can request the next one
//         //       yield `___SEARCH_PAGE___${searchPage}___`;
//         //     }
//         //   }
//         // }

//         // if (chunk.type === "response.mcp_call_arguments.done") {
//         //   lastMcpArguments = chunk.arguments;
//         //   console.log("🔧 MCP arguments done:", chunk.arguments);
//         // }

//         // track which tool has triggered
//         // if (chunk.type === "response.output_item.added") {
//         //   const item = (chunk as any).item;
//         //   if (item?.type === "mcp_call") {
//         //     if (item.item_id && item.name) {
//         //       mcpCallNamesByItemId[item.item_id] = item.name;
//         //     }
//         //     console.log("🔧 MCP tool name:", item.name, "| server:", item.server_label);
//         //   }
//         //   if (item?.type === "file_search_call") {
//         //     console.log("🔍 FAQ file search triggered!!");
//         //   }
//         // }

//         // Then log them on failure:
//         // if (chunk.type === "response.mcp_call.failed") {
//         //   const failedItemId = (chunk as any).item_id as string | undefined;
//         //   const failedToolName = (chunk as any).name ?? (failedItemId ? mcpCallNamesByItemId[failedItemId] : undefined) ?? "(unknown)";

//         //   console.warn("❌ MCP call failed — tool:", failedToolName, "| item_id:", failedItemId ?? "(missing)", "arguments:", lastMcpArguments);
//         // }
//       }
//     } catch (error) {
//       console.error("❌ Error in ChatService:", error);
//       throw new Error(`Chat processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
//     }
//   }
// }
