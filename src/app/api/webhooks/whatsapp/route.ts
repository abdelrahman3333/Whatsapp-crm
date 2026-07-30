import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";

// Webhook Verification (Required by Meta)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mock_token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

// Inbound Message Handler
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (data.object === "whatsapp_business_account") {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const msg of change.value.messages) {
              const fromPhone = msg.from;
              const text = msg.text?.body;
              
              if (!text) continue; // Only handle text for now

              // In multi-tenant real app, determine companyId from the receiving phone number (change.value.metadata.display_phone_number)
              // For mock, we pass _mock_company_id
              const companyId = data._mock_company_id;
              if (!companyId) continue;

              // 1. Find or create Customer
              let customer = await prisma.customer.findFirst({
                where: { phone: fromPhone, companyId }
              });

              if (!customer) {
                // Auto-create lead
                const defaultStage = await prisma.pipelineStage.findFirst({
                  where: { companyId },
                  orderBy: { order: 'asc' }
                });

                customer = await prisma.customer.create({
                  data: {
                    name: `WA Contact ${fromPhone.slice(-4)}`,
                    phone: fromPhone,
                    companyId,
                    pipelineStageId: defaultStage?.id
                  }
                });

                // Trigger NEW_LEAD Automations
                const newLeadRules = await prisma.automationRule.findMany({
                  where: { companyId, trigger: 'NEW_LEAD', isActive: true }
                });
                
                for (const rule of newLeadRules) {
                  try {
                    const message = rule.messageTemplate.replace('{{customer_name}}', customer.name);
                    await WhatsAppService.sendMessage(companyId, customer.id, customer.phone, message);
                    
                    await prisma.automationLog.create({
                      data: { ruleId: rule.id, customerId: customer.id }
                    });
                  } catch (err) {
                    console.error("Failed to send NEW_LEAD automation", err);
                  }
                }
              }

              // 2. Find or create Conversation
              let conversation = await prisma.conversation.findFirst({
                where: { customerId: customer.id }
              });

              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: { customerId: customer.id }
                });
              }

              // 3. Save Inbound Message
              await prisma.message.create({
                data: {
                  content: text,
                  direction: "INBOUND",
                  conversationId: conversation.id
                }
              });

              console.log(`[MOCK WA] Saved inbound message from ${fromPhone}`);
            }
          }
        }
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
