import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  
});

const vector_store_id = process.env.VECTOR_STORE_ID;

const prompt =
  "You are a helpful assistant for Kednex Company. Continue chain conversation and feel like a human. Always be polite and helpful. Use the following tools when needed: file_search. Always use the tools when you need to find information. If you use a tool, wait for the response and then continue the conversation based on the tool's output. Do not make up information. If you don't know something, say you don't know. Always be polite and helpful. Do not mention files or tools to the user. Use them only to find information and then respond based on that information. Anser with first person perspective, Always be friendly and helpful.";

export async function POST(request: Request) {
  let body: any;

  try {
    const payload = await request.json();
    console.log("backend recived payload : ", payload)

  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // console.log("body is received to backend: ", body);

  // const message = typeof body?.message === "string" ? body.message.trim() : "";

  // if (!message) {
  //   return NextResponse.json({ error: "Message is required" }, { status: 400 });
  // }

  // try {
  //   const tools = vector_store_id
  //     ? [{ type: "file_search", vector_store_ids: [vector_store_id] }]
  //     : [];

  //   const requestPayload: any = {
  //     model: "gpt-4o-mini",
  //     input: message,
  //     instructions: prompt,
  //     max_output_tokens: 500,
  //   };

  //   if (tools.length > 0) {
  //     requestPayload.tools = tools;
  //   }

  //   if (body.previousResponseId) {
  //     requestPayload.previous_response_id = body.previousResponseId;
  //   }

  //   const response = await openai.responses.create(requestPayload);

  //   return NextResponse.json({
  //     reply: response.output_text,
  //     responseId: response.id,
  //   });
  // } catch (error) {
  //   const messageText =
  //     error instanceof Error ? error.message : "Unexpected error";
  //   return NextResponse.json({ error: messageText }, { status: 500 });
  // }
}