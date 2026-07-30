import prisma from "@/lib/prisma";

export const PLAN_LIMITS = {
  BASIC: {
    maxUsers: 2,
    maxCustomers: 100,
    maxMessagesPerMonth: 500,
  },
  BUSINESS: {
    maxUsers: 5,
    maxCustomers: 1000,
    maxMessagesPerMonth: 5000,
  },
  PREMIUM: {
    maxUsers: Infinity,
    maxCustomers: Infinity,
    maxMessagesPerMonth: Infinity,
  }
};

export async function getCompanySubscription(companyId: string) {
  let sub = await prisma.subscription.findUnique({
    where: { companyId }
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: { companyId, plan: 'BASIC' }
    });
  }

  return sub;
}

export async function checkCustomerLimit(companyId: string) {
  const sub = await getCompanySubscription(companyId);
  const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];
  
  if (limits.maxCustomers === Infinity) return true;

  const count = await prisma.customer.count({
    where: { companyId }
  });

  if (count >= limits.maxCustomers) {
    throw new Error(`Plan limit reached. Your ${sub.plan} plan allows up to ${limits.maxCustomers} customers.`);
  }

  return true;
}

export async function checkUserLimit(companyId: string) {
  const sub = await getCompanySubscription(companyId);
  const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];
  
  if (limits.maxUsers === Infinity) return true;

  const count = await prisma.user.count({
    where: { companyId }
  });

  if (count >= limits.maxUsers) {
    throw new Error(`Plan limit reached. Your ${sub.plan} plan allows up to ${limits.maxUsers} users.`);
  }

  return true;
}

export async function checkMessageLimit(companyId: string) {
  const sub = await getCompanySubscription(companyId);
  const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];
  
  if (limits.maxMessagesPerMonth === Infinity) return true;

  // Calculate start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // We need to count outbound messages for this company
  // Since Message connects to Conversation which connects to Customer (which belongs to Company)
  const count = await prisma.message.count({
    where: {
      direction: 'OUTBOUND',
      timestamp: { gte: startOfMonth },
      conversation: {
        customer: {
          companyId: companyId
        }
      }
    }
  });

  if (count >= limits.maxMessagesPerMonth) {
    throw new Error(`Plan limit reached. Your ${sub.plan} plan allows up to ${limits.maxMessagesPerMonth} messages per month.`);
  }

  return true;
}
