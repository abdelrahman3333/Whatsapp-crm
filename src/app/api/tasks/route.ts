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

    const userId = (session.user as any).id;
    
    // Fetch upcoming tasks for the logged in user
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        isCompleted: false,
      },
      include: {
        customer: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(tasks);
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

    const data = await request.json();
    const { title, dueDate, customerId, assignedUserId } = data;

    if (!title || !customerId || !assignedUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        customerId,
        userId: assignedUserId,
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
