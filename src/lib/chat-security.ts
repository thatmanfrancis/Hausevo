import prisma from "@/lib/prisma";

/**
 * Mask any 10-14 digit sequences (phone numbers, account numbers, etc.)
 * that are sent in a single message.
 */
export function maskPhoneNumbers(text: string): { maskedText: string; hasPhone: boolean } {
  let hasPhone = false;
  // Match potential digit groups (lengths between 10 and 25 to accommodate spaces, dashes, parentheses, or dots)
  const maskedText = text.replace(/(\+?[\d\s()-.]{10,25})/g, (match) => {
    const digits = match.replace(/\D/g, "");
    // Standard Nigerian phone numbers are 11 digits (starts with 0) or 10 digits (without 0),
    // and international numbers are 13/14 digits (starts with +234 or 234)
    if (digits.length >= 10 && digits.length <= 14) {
      hasPhone = true;
      return " [blurred] ";
    }
    return match;
  });
  return { maskedText, hasPhone };
}

/**
 * Check if the user is sending a phone number character-by-character
 * or in split messages. If detected, mask recent messages that contributed
 * to this sequence and return the masked current message.
 */
export async function handleSplitPhoneNumberDetection(
  chatId: string,
  senderId: string,
  currentContent: string
): Promise<{ processedContent: string; wasSplitDetected: boolean }> {
  // First, check if the single message itself has a phone number
  const { maskedText, hasPhone } = maskPhoneNumbers(currentContent);
  if (hasPhone) {
    return { processedContent: maskedText, wasSplitDetected: true };
  }

  // Get recent messages from the same sender in this chat room sent within the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentMessages = await prisma.message.findMany({
    where: {
      chatId,
      senderId,
      createdAt: { gte: fiveMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, content: true },
  });

  // Reconstruct the message stream in chronological order:
  const historical = [...recentMessages].reverse();

  // Create an array mapping character position to their source message IDs
  // undefined source indicates the current unsaved message.
  interface CharSource {
    char: string;
    msgId?: string; // undefined means current message
  }

  const charSources: CharSource[] = [];
  for (const msg of historical) {
    for (const char of msg.content) {
      charSources.push({ char, msgId: msg.id });
    }
  }
  for (const char of currentContent) {
    charSources.push({ char, msgId: undefined });
  }

  // Filter to digit stream only
  interface DigitSource {
    digit: string;
    msgId?: string;
  }
  const digitSources: DigitSource[] = [];
  for (const src of charSources) {
    if (/\d/.test(src.char)) {
      digitSources.push({ digit: src.char, msgId: src.msgId });
    }
  }

  // Find if there is any window of 10 to 14 digits in the digit stream
  let detectedWindowStartIndex = -1;
  let detectedWindowLength = 0;

  // Search for any window of length between 10 and 14
  for (let len = 14; len >= 10; len--) {
    for (let i = 0; i <= digitSources.length - len; i++) {
      detectedWindowStartIndex = i;
      detectedWindowLength = len;
      break;
    }
    if (detectedWindowStartIndex !== -1) break;
  }

  if (detectedWindowStartIndex !== -1) {
    // Phone number detected in the digit stream!
    const activeWindow = digitSources.slice(
      detectedWindowStartIndex,
      detectedWindowStartIndex + detectedWindowLength
    );

    const contributingMsgIds = new Set<string>();
    let currentMessageContributed = false;

    for (const src of activeWindow) {
      if (src.msgId) {
        contributingMsgIds.add(src.msgId);
      } else {
        currentMessageContributed = true;
      }
    }

    // Only flag if the current message actually contributed to the detected phone number
    if (currentMessageContributed) {
      // 1. Mask all contributing historical messages in the database
      if (contributingMsgIds.size > 0) {
        await prisma.message.updateMany({
          where: {
            id: { in: Array.from(contributingMsgIds) },
          },
          data: {
            content: "[blurred]",
          },
        });
      }

      // 2. Return masked version of current message
      return {
        processedContent: "[blurred]",
        wasSplitDetected: true,
      };
    }
  }

  return { processedContent: currentContent, wasSplitDetected: false };
}
