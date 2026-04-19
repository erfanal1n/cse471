import { OrderCatalogItem } from "./order-management";

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

export async function sendDeliveryReceiptEmail(order: OrderCatalogItem): Promise<boolean> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error("[EmailJS] Missing configuration. Check EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY in .env");
    return false;
  }

  if (!order.customerEmail) {
    console.warn(`[EmailJS] Order ${order.orderNumber} has no customer email. Skipping receipt.`);
    return false;
  }

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: order.customerEmail,
      to_name: order.customerName,
      order_number: order.orderNumber,
      total_amount: order.totalAmount.toFixed(2),
      shipping_address: order.shippingAddress,
    },
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[EmailJS] Request failed with status ${response.status}: ${responseText}`);
      return false;
    }

    console.log(`[EmailJS] Delivery receipt sent successfully to ${order.customerEmail} for order ${order.orderNumber}`);
    return true;
  } catch (err) {
    console.error("[EmailJS] Network error while sending receipt:", err);
    return false;
  }
}
