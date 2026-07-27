import type { Api } from "grammy";
import { dailyPredictions, formatPrediction, getSettings, logDigestDelivery, subscriberIds, utcDay } from "./research-store.js";

type TelegramApi = Pick<Api, "sendMessage">;

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends one daily digest to every explicitly indexed subscriber.  A deployment
 * scheduler calls this function; the function itself is safe to retry because a
 * failed or blocked chat is isolated from the rest of the delivery batch.
 */
export async function deliverDailyDigest(api: TelegramApi): Promise<{ delivered: number; failed: number }> {
  const settings = await getSettings();
  const matches = await dailyPredictions(utcDay(), settings?.digestLimit ?? 5);
  const text = matches.length === 0
    ? "No matches are scheduled for today. Check back for the next digest."
    : `Today’s research digest\n\n${matches.map(formatPrediction).join("\n\n")}`;
  const subscribers = await subscriberIds();
  let delivered = 0;
  let failed = 0;
  // Telegram permits roughly 30 messages per second. Keep a margin and process
  // batches so a 100+ subscriber digest neither floods the API nor aborts early.
  for (let i = 0; i < subscribers.length; i += 20) {
    const batch = subscribers.slice(i, i + 20);
    const results = await Promise.all(batch.map(async (chatId) => {
      try {
        await api.sendMessage(chatId, text);
        return true;
      } catch {
        return false;
      }
    }));
    delivered += results.filter(Boolean).length;
    failed += results.filter((result) => !result).length;
    if (i + 20 < subscribers.length) await pause(1000);
  }
  await logDigestDelivery(utcDay(), delivered, failed);
  return { delivered, failed };
}
