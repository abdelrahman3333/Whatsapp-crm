import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PLAN_LIMITS, getCompanySubscription } from "@/lib/subscription";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const sub = await getCompanySubscription(companyId);
    const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];

    // Calculate Usage
    const customersCount = await prisma.customer.count({ where: { companyId } });
    const usersCount = await prisma.user.count({ where: { companyId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const messagesCount = await prisma.message.count({
      where: {
        direction: 'OUTBOUND',
        timestamp: { gte: startOfMonth },
        conversation: {
          customer: { companyId }
        }
      }
    });

    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      usage: {
        customers: customersCount,
        users: usersCount,
        messages: messagesCount
      },
      limits: {
        customers: limits.maxCustomers,
        users: limits.maxUsers,
        messages: limits.maxMessagesPerMonth
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
