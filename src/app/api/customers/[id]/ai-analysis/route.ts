import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = params.id;
    const companyId = (session.user as any).companyId;

    // 1. Fetch customer and conversation history
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
      include: {
        conversations: {
          include: {
            messages: { orderBy: { timestamp: 'asc' } }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const allMessages = customer.conversations.flatMap((c: any) => c.messages);
    if (allMessages.length === 0) {
      return NextResponse.json({ error: "No conversation history to analyze" }, { status: 400 });
    }

    let result;

    if (!process.env.OPENAI_API_KEY) {
      // MOCK RESPONSE if no API key
      result = {
        summary: "The customer is very interested in the premium package but is asking for a discount.",
        interestLevel: 85,
        budget: "$2,000",
        nextSteps: "Follow up next Tuesday to confirm discount approval.",
        suggestedReply: `Hi ${customer.name}, I spoke with my manager and we can offer you a 10% discount on the premium package! Let me know if you'd like to proceed.`
      };
    } else {
      // REAL OPENAI INTEGRATION
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const chatTranscript = allMessages.map((m: any) => 
        `[${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}] ${m.content}`
      ).join('\n');

      const prompt = `
You are an expert Sales AI Assistant analyzing a WhatsApp conversation between a sales agent and a customer named ${customer.name}.
Read the transcript and extract the following:
1. summary: A brief 2-sentence summary of the conversation.
2. interestLevel: An integer from 0 to 100 representing how likely they are to buy.
3. budget: The customer's budget if mentioned, otherwise "Unknown".
4. nextSteps: What the agent should do next.
5. suggestedReply: A natural, professional WhatsApp reply the agent can send right now.

Transcript:
${chatTranscript}

Respond strictly in JSON format matching this schema:
{
  "summary": "...",
  "interestLevel": 85,
  "budget": "...",
  "nextSteps": "...",
  "suggestedReply": "..."
}
`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseContent = aiResponse.choices[0]?.message?.content;
      if (!responseContent) throw new Error("Empty response from AI");
      
      result = JSON.parse(responseContent);
    }

    // 2. Save to DB
    const profile = await prisma.customerAIProfile.upsert({
      where: { customerId: customer.id },
      update: {
        interestLevel: result.interestLevel,
        budget: result.budget,
        summary: result.summary,
        nextSteps: result.nextSteps,
        suggestedReply: result.suggestedReply
      },
      create: {
        customerId: customer.id,
        interestLevel: result.interestLevel,
        budget: result.budget,
        summary: result.summary,
        nextSteps: result.nextSteps,
        suggestedReply: result.suggestedReply
      }
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.customerAIProfile.findUnique({
      where: { customerId: params.id }
    });

    return NextResponse.json(profile || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
