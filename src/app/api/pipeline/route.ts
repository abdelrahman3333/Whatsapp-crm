import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_STAGES = [
  "New Lead",
  "Contacted",
  "Interested",
  "Negotiation",
  "Won",
  "Lost"
];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = (session.user as any).companyId;

    let stages = await prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: {
        customers: {
          orderBy: { updatedAt: 'desc' },
          include: { aiProfile: true }
        }
      }
    });

    // Seed default stages if none exist
    if (stages.length === 0) {
      for (let i = 0; i < DEFAULT_STAGES.length; i++) {
        await prisma.pipelineStage.create({
          data: {
            name: DEFAULT_STAGES[i],
            order: i,
            companyId: companyId
          }
        });
      }
      stages = await prisma.pipelineStage.findMany({
        where: { companyId },
        orderBy: { order: 'asc' },
        include: {
          customers: {
            orderBy: { updatedAt: 'desc' }
          }
        }
      });
    }

    // Since we also want to display customers that have NO stage yet in the "New Lead" column,
    // let's fetch customers with no stage and append them to the first stage.
    const unassignedCustomers = await prisma.customer.findMany({
      where: { companyId, pipelineStageId: null },
      orderBy: { createdAt: 'desc' }
    });

    if (unassignedCustomers.length > 0 && stages.length > 0) {
      stages[0].customers = [...unassignedCustomers, ...stages[0].customers];
    }

    return NextResponse.json(stages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { customerId, newStageId } = data;

    if (!customerId || !newStageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { pipelineStageId: newStageId }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
