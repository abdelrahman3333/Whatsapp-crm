import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    // 1. Customers Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customersToday = await prisma.customer.count({
      where: {
        companyId,
        createdAt: { gte: today }
      }
    });

    const totalCustomers = await prisma.customer.count({
      where: { companyId }
    });

    // 2. Deals Stats
    const deals = await prisma.deal.findMany({
      where: { companyId },
      include: { user: true }
    });

    const totalDeals = deals.length;
    const wonDeals = deals.filter((d: any) => d.status === "WON");
    const openDeals = deals.filter((d: any) => d.status === "OPEN");
    const lostDeals = deals.filter((d: any) => d.status === "LOST");

    const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + d.value, 0);
    const conversionRate = totalCustomers > 0 ? ((wonDeals.length / totalCustomers) * 100).toFixed(1) : 0;

    // 3. Top Agents
    const agentSales: Record<string, { name: string; revenue: number }> = {};
    wonDeals.forEach((d: any) => {
      if (d.userId && d.user) {
        if (!agentSales[d.userId]) {
          agentSales[d.userId] = { name: d.user.name || "Unknown", revenue: 0 };
        }
        agentSales[d.userId].revenue += d.value;
      }
    });

    const topAgents = Object.values(agentSales).sort((a, b) => b.revenue - a.revenue);

    // 4. Lead Sources
    const customers = await prisma.customer.findMany({
      where: { companyId },
      select: { source: true }
    });

    const sourceCounts: Record<string, number> = {};
    customers.forEach((c: any) => {
      const src = c.source || "Unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const leadSources = Object.keys(sourceCounts).map(key => ({
      name: key,
      value: sourceCounts[key]
    }));

    return NextResponse.json({
      customersToday,
      totalCustomers,
      deals: {
        total: totalDeals,
        won: wonDeals.length,
        open: openDeals.length,
        lost: lostDeals.length
      },
      totalRevenue,
      conversionRate,
      topAgents,
      leadSources
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
