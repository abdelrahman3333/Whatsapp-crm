import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkCustomerLimit } from "@/lib/subscription";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const customers = await prisma.customer.findMany({
      where: {
        companyId: (session.user as any).companyId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        } : {})
      },
      include: {
        pipelineStage: true,
        aiProfile: true
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const companyId = (session.user as any).companyId;

    // Enforce Plan Limits
    await checkCustomerLimit(companyId);

    const data = await request.json();
    const { name, phone, pipelineStageId } = data;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        companyId: companyId,
        ...(pipelineStageId ? { pipelineStageId } : {})
      },
    });

    // Handle NEW_LEAD automations
    const newLeadRules = await prisma.automationRule.findMany({
      where: {
        companyId,
        trigger: "NEW_LEAD",
        isActive: true
      }
    });

    for (const rule of newLeadRules) {
      // 1. Send the message (Mock)
      const msg = await prisma.message.create({
        data: {
          content: rule.template,
          direction: "OUTBOUND",
          customerId: customer.id,
          companyId: companyId,
        }
      });
      // Also link to conversation
      let conv = await prisma.conversation.findFirst({
        where: { customerId: customer.id, companyId }
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { customerId: customer.id, companyId, platform: "WHATSAPP" }
        });
      }
      await prisma.message.update({
        where: { id: msg.id },
        data: { conversationId: conv.id }
      });

      // 2. Log automation
      await prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          customerId: customer.id,
          companyId: companyId
        }
      });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A customer with this phone number already exists in your company." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Plan limit') ? 403 : 500 });
  }
}
