/**
 * Zeptomail Service
 * Handles sending emails via the Zeptomail HTTP API.
 */

const ZEPTOMAIL_API_URL =
  process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email";

interface SendEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  inline_images?: { cid: string; content: string; mime_type: string }[];
}

export async function sendEmail({
  to,
  subject,
  html,
  inline_images,
}: SendEmailOptions) {
  const apiKey = process.env.ZEPTOMAIL_API_KEY?.trim();
  const senderEmail = process.env.ZEPTOMAIL_SENDER_EMAIL?.trim();
  const senderName = process.env.ZEPTOMAIL_SENDER_NAME?.trim() || "Hausevo";

  if (!apiKey || !senderEmail) {
    console.warn(
      "[mail] Zeptomail configuration missing (API Key or Sender Email). Skipping email send.",
    );
    return { success: false, error: "Missing configuration" };
  }

  try {
    console.log(`[mail] Sending via Zeptomail API: ${ZEPTOMAIL_API_URL}`);
    const response = await fetch(ZEPTOMAIL_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: process.env.ZEPTOMAIL_API_KEY!,
      },
      body: JSON.stringify({
        from: {
          address: senderEmail,
          name: senderName,
        },
        to: to.map((recipient) => ({
          email_address: {
            address: recipient.email,
            name: recipient.name || recipient.email,
          },
        })),
        subject,
        htmlbody: html,
        inline_images: inline_images || [],
      }),
    });

    console.log(
      `[mail] Sending email from ${senderEmail} to ${to.map((r) => r.email).join(", ")}`,
    );

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      console.error(
        `[mail] Zeptomail API error (Status: ${response.status}):`,
        data,
      );
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[mail] Failed to send email:", error);
    return { success: false, error };
  }
}
