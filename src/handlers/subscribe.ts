import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { confirmKeyboard, inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { persistenceReady, updateSubscription } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Subscribe", data: "subscribe:open", order: 10 });
const composer = new Composer<Ctx>();

const ask = "Receive the daily prediction digest at the default research time?";
const unavailable = "Subscriptions aren’t set up yet. Please try again when persistent storage is available.";

async function open(ctx: Ctx, edit = false) {
  if (!persistenceReady()) return edit ? ctx.editMessageText(unavailable) : ctx.reply(unavailable);
  const extra = { reply_markup: confirmKeyboard("subscribe", { yes: "Subscribe", no: "Back" }) };
  return edit ? ctx.editMessageText(ask, extra) : ctx.reply(ask, extra);
}
composer.command("subscribe", (ctx) => open(ctx));
composer.callbackQuery("subscribe:open", async (ctx) => { await ctx.answerCallbackQuery(); await open(ctx, true); });
composer.callbackQuery("subscribe:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await updateSubscription(ctx.from.id, true))) return ctx.editMessageText(unavailable);
  await ctx.editMessageText("You’re subscribed. Your daily digest will arrive at the configured time.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});
composer.callbackQuery("subscribe:no", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("No subscription was added.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) }); });

export default composer;
