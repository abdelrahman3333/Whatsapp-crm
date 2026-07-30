import prisma from "@/lib/prisma";

export class WhatsAppService {
  /**
   * Send a WhatsApp message to a customer.
   * Uses mock simulation if process.env.USE_MOCK_WHATSAPP is not 'false'.
   */
  static async sendMessage(
    companyId: string,
    customerId: string,
    toPhone: string,
    content: string
  ) {
    // 1. Ensure Conversation exists
    let conversation = await prisma.conversation.findFirst({
      where: { customerId }
    });
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerId }
      });
    }

    // 2. Log Outbound Message
    const message = await prisma.message.create({
      data: {
        content,
        direction: "OUTBOUND",
        conversationId: conversation.id
      }
    });

    const isMock = process.env.USE_MOCK_WHATSAPP !== 'false';
    
    if (isMock) {
      console.log(`[MOCK WA] Sending message to ${toPhone}: ${content}`);
      
      // Simulate Auto-Reply for testing purposes
      // Fire and forget a simulated webhook call
      setTimeout(async () => {
        try {
          // Use port 3001 since the user's dev server is likely running there
          const appUrl = process.env.APP_URL || 'http://localhost:3001';
          await fetch(`${appUrl}/api/webhooks/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              object: "whatsapp_business_account",
              entry: [{
                changes: [{
                  value: {
                    messages: [{
                      from: toPhone,
                      text: { body: `This is an auto-reply mock message to your text: "${content}"` }
                    }]
                  }
                }]
              }],
              _mock_company_id: companyId // We pass this hidden field in mock mode because normally we resolve company via WA Phone Number ID.
            })
          });
        } catch (e) {
          console.error("Mock auto-reply failed", e);
        }
      }, 5000);

      return message;
    }

    // --- REAL WHATSAPP CLOUD API INTEGRATION ---
    /*
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID; // In multi-tenant, fetch this from WhatsAppConnection table
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "text",
        text: { body: content }
      })
    });
    
    if (!response.ok) {
      throw new Error(`WhatsApp API Error: ${await response.text()}`);
    }
    */
    
    return message;
  }
}
