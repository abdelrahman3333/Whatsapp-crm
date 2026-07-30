import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const rules = await prisma.automationRule.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { logs: true }
        }
      }
    });

    return NextResponse.json(rules);
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
    const data = await request.json();
    const { name, trigger, condition, messageTemplate } = data;

    if (!name || !trigger || !messageTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        trigger,
        condition,
        messageTemplate,
        companyId
      }
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
