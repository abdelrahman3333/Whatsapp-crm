import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { WhatsAppService } from "@/lib/whatsapp";
import prisma from "@/lib/prisma";
import { checkMessageLimit } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    
    // Enforce Plan Limits
    await checkMessageLimit(companyId);

    const data = await request.json();
    const { customerId, content } = data;

    if (!customerId || !content) {
      return NextResponse.json({ error: "Missing customerId or content" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer || customer.companyId !== companyId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const message = await WhatsAppService.sendMessage(companyId, customerId, customer.phone, content);

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Plan limit') ? 403 : 500 });
  }
}
