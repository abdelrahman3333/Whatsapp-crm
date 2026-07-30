import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkCustomerLimit } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const companyId = (session.user as any).companyId;

    const data = await request.json();
    const { customers } = data; // Array of { name, phone }

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: "No customers provided." }, { status: 400 });
    }

    // Enforce Plan Limits
    const currentCount = await prisma.customer.count({ where: { companyId } });
    
    // We can't perfectly predict checkCustomerLimit with bulk since it only checks current vs limit,
    // so we manually check the sub limits to prevent bulk abuse.
    const sub = await prisma.subscription.findUnique({ where: { companyId } });
    const limit = sub?.plan === "PREMIUM" ? Infinity : sub?.plan === "BUSINESS" ? 1000 : 100;
    
    if (currentCount + customers.length > limit) {
      return NextResponse.json({ 
        error: `Importing ${customers.length} customers exceeds your plan limit of ${limit}. You currently have ${currentCount}. Please upgrade your plan.` 
      }, { status: 403 });
    }

    // Format for DB
    const formattedData = customers
      .filter((c: any) => c.name && c.phone) // Ensure both exist
      .map((c: any) => ({
        name: String(c.name).trim(),
        phone: String(c.phone).trim(),
        companyId,
        source: "Excel Import"
      }));

    if (formattedData.length === 0) {
      return NextResponse.json({ error: "No valid customers found in file." }, { status: 400 });
    }

    const result = await prisma.customer.createMany({
      data: formattedData,
      skipDuplicates: true // Will skip customers with existing phone numbers
    });

    return NextResponse.json({ count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
