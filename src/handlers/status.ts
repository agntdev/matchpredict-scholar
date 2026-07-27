import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getSettings, persistenceReady, subscriberIds } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "System status", data: "status:show", order: 70 });
const composer = new Composer<Ctx>();
function isAdmin(ctx: Ctx): boolean {
  const id = typeof process === "undefined" ? undefined : process.env.ADMIN_CHAT_ID;
  return id !== undefined && id === String(ctx.from?.id);
}
async function show(ctx: Ctx, edit = false) {
  const respond = (text: string) => edit ? ctx.editMessageText(text, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) }) : ctx.reply(text, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
  if (!isAdmin(ctx)) return respond("This status view is restricted to the research administrator.");
  if (!persistenceReady()) return respond("System metrics aren’t available until persistent storage is configured.");
  const [settings, subscribers] = await Promise.all([getSettings(), subscriberIds()]);
  return respond(`System health is available.\n\nActive digest subscribers: ${subscribers.length}\nDigest time: ${settings?.digestTime ?? "not configured"}\nDigest match limit: ${settings?.digestLimit ?? 5}\nAdmin notifications: ${settings?.adminNotifications ? "enabled" : "disabled"}`);
}
composer.command("status", (ctx) => show(ctx));
composer.callbackQuery("status:show", async (ctx) => { await ctx.answerCallbackQuery(); await show(ctx, true); });

composer.command("status", async (ctx) => {
  await ctx.reply("Admin-only system health check");
});

export default composer;
