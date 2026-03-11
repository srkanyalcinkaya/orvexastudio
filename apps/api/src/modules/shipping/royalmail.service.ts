import axios from "axios";
import { env } from "../../config/env.js";

interface LabelInput {
  orderNumber: string;
  recipientName: string;
  postcode: string;
}

interface LabelResult {
  trackingNumber: string;
  labelUrl: string;
}

export async function createRoyalMailLabel(input: LabelInput): Promise<LabelResult> {
  if (!env.ROYAL_MAIL_API_KEY || !env.ROYAL_MAIL_API_SECRET) {
    return {
      trackingNumber: `RM-SIM-${Date.now()}`,
      labelUrl: `https://labels.example.com/${input.orderNumber}.pdf`,
    };
  }

  const response = await axios.post(
    `${env.ROYAL_MAIL_API_BASE_URL}/shipments`,
    {
      orderNumber: input.orderNumber,
      recipientName: input.recipientName,
      toPostcode: input.postcode,
      fromPostcode: env.SHIPPING_FROM_POSTCODE,
    },
    {
      headers: {
        "X-API-KEY": env.ROYAL_MAIL_API_KEY,
        "X-API-SECRET": env.ROYAL_MAIL_API_SECRET,
      },
      timeout: 20_000,
    },
  );

  return {
    trackingNumber: response.data.trackingNumber,
    labelUrl: response.data.labelUrl,
  };
}
