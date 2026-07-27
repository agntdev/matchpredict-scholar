import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { confirmKeyboard, inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { persistenceReady, updateSubscription } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Unsubscribe", data: "unsubscribe:open", order: 60 });
const composer = new Composer<Ctx>();

const ask = "Stop receiving the daily prediction digest?";
const unavailable = "Subscriptions aren’t set up yet. Please try again when persistent storage is available.";
async function open(ctx: Ctx, edit = false) {
  if (!persistenceReady()) return edit ? ctx.editMessageText(unavailable) : ctx.reply(unavailable);
  const extra = { reply_markup: confirmKeyboard("unsubscribe", { yes: "Unsubscribe", no: "Back" }) };
  return edit ? ctx.editMessageText(ask, extra) : ctx.reply(ask, extra);
}
composer.command("unsubscribe", (ctx) => open(ctx));
composer.callbackQuery("unsubscribe:open", async (ctx) => { await ctx.answerCallbackQuery(); await open(ctx, true); });
composer.callbackQuery("unsubscribe:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await updateSubscription(ctx.from.id, false))) return ctx.editMessageText(unavailable);
  await ctx.editMessageText("You’re unsubscribed. You can subscribe again at any time.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});
composer.callbackQuery("unsubscribe:no", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Your subscription is unchanged.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) }); });

export default composer;
