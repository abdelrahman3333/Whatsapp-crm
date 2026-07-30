import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";

// This endpoint should be triggered by a Cron job (e.g. Vercel Cron, cron-job.org)
export async function GET(request: Request) {
  try {
    // 1. Fetch all ACTIVE time-based and no-reply rules
    const rules = await prisma.automationRule.findMany({
      where: {
        isActive: true,
        trigger: { in: ['TIME_BASED_FOLLOWUP', 'NO_REPLY'] }
      }
    });

    let messagesSent = 0;

    for (const rule of rules) {
      const daysStr = rule.condition?.replace('_days', '') || '3';
      const waitDays = parseInt(daysStr, 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - waitDays);

      if (rule.trigger === 'TIME_BASED_FOLLOWUP') {
        // Find customers older than cutoffDate who haven't received THIS rule yet
        const eligibleCustomers = await prisma.customer.findMany({
          where: {
            companyId: rule.companyId,
            createdAt: { lte: cutoffDate },
            automationLogs: {
              none: { ruleId: rule.id }
            }
          }
        });

        for (const customer of eligibleCustomers) {
          try {
            const message = rule.messageTemplate.replace('{{customer_name}}', customer.name);
            await WhatsAppService.sendMessage(rule.companyId, customer.id, customer.phone, message);
            
            await prisma.automationLog.create({
              data: { ruleId: rule.id, customerId: customer.id }
            });
            messagesSent++;
          } catch (err) {
            console.error("Failed to send time-based automation", err);
          }
        }
      } 
      else if (rule.trigger === 'NO_REPLY') {
        // Find customers who received an OUTBOUND message before cutoffDate
        // and have NO INBOUND messages since then, and haven't received THIS rule.
        const eligibleCustomers = await prisma.customer.findMany({
          where: {
            companyId: rule.companyId,
            conversations: {
              some: {
                messages: {
                  some: { direction: 'OUTBOUND', timestamp: { lte: cutoffDate } }
                }
              }
            },
            automationLogs: {
              none: { ruleId: rule.id }
            }
          },
          include: {
            conversations: {
              include: { messages: { orderBy: { timestamp: 'desc' }, take: 1 } }
            }
          }
        });

        for (const customer of eligibleCustomers) {
          // Double check if last message was indeed outbound and older than cutoff
          const lastMsg = customer.conversations[0]?.messages[0];
          if (lastMsg && lastMsg.direction === 'OUTBOUND' && lastMsg.timestamp <= cutoffDate) {
            try {
              const message = rule.messageTemplate.replace('{{customer_name}}', customer.name);
              await WhatsAppService.sendMessage(rule.companyId, customer.id, customer.phone, message);
              
              await prisma.automationLog.create({
                data: { ruleId: rule.id, customerId: customer.id }
              });
              messagesSent++;
            } catch (err) {
              console.error("Failed to send no-reply automation", err);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (error: any) {
    console.error("Cron automation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
