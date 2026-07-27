import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem, type InlineKeyboardMarkup } from "../toolkit/index.js";
import { dailyPredictions, formatPrediction, getSettings, getUser, logRequest, persistenceReady, utcDay } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Today’s digest", data: "today:show", order: 20 });
const composer = new Composer<Ctx>();
async function show(ctx: Ctx, edit = false) {
  const reply = (text: string, extra?: { reply_markup?: InlineKeyboardMarkup }) => edit ? ctx.editMessageText(text, extra) : ctx.reply(text, extra);
  if (!persistenceReady()) return reply("Today’s digest isn’t set up yet. Please try again when persistent storage is available.");
  if (!ctx.from) return reply("I couldn’t identify your Telegram account. Please try again.");
  const user = await getUser(ctx.from.id);
  if (!user?.subscription_status) return reply("Subscribe first to receive today’s research digest.", { reply_markup: inlineKeyboard([[inlineButton("Subscribe", "subscribe:open")], [inlineButton("Back to menu", "menu:main")]]) });
  const settings = await getSettings();
  const matches = await dailyPredictions(utcDay(), settings?.digestLimit ?? 5);
  if (matches.length === 0) return reply("No matches are scheduled for today. Check back for the next digest.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
  await logRequest(ctx.from.id, "today");
  await reply(`Today’s research digest\n\n${matches.map(formatPrediction).join("\n\n")}`, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
}
composer.command("today", (ctx) => show(ctx));
composer.callbackQuery("today:show", async (ctx) => { await ctx.answerCallbackQuery(); await show(ctx, true); });

composer.command("today", async (ctx) => {
  await ctx.reply("Request today's sports prediction digest immediately");
});

export default composer;
