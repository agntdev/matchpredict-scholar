import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { historyFor, logRequest, persistenceReady } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Historical data", data: "history:open", order: 40 });
const composer = new Composer<Ctx>();
const kinds = inlineKeyboard([[inlineButton("Team", "history:kind:team"), inlineButton("Player", "history:kind:player")], [inlineButton("Match", "history:kind:match")], [inlineButton("Back to menu", "menu:main")]]);
async function choose(ctx: Ctx, edit = false) { return edit ? ctx.editMessageText("Choose the historical data you want to search.", { reply_markup: kinds }) : ctx.reply("Choose the historical data you want to search.", { reply_markup: kinds }); }
composer.command("history", (ctx) => choose(ctx));
composer.callbackQuery("history:open", async (ctx) => { await ctx.answerCallbackQuery(); await choose(ctx, true); });
composer.callbackQuery(/^history:kind:(team|player|match)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "history";
  ctx.session.historyKind = ctx.match[1] as "team" | "player" | "match";
  await ctx.editMessageText(`Send the ${ctx.match[1]} name or ID to search.`);
});
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "history" || !ctx.session.historyKind) return next();
  const kind = ctx.session.historyKind; ctx.session.step = undefined; ctx.session.historyKind = undefined;
  if (!persistenceReady()) return ctx.reply("Historical research isn’t set up yet. Please try again when persistent storage is available.");
  const records = await historyFor(kind, ctx.message.text.trim());
  if (records.length === 0) return ctx.reply("No anonymised historical records were found. Check the search and try again.");
  if (ctx.from) await logRequest(ctx.from.id, `history ${kind}`);
  await ctx.reply(`Historical records (${records.length}):\n\n${records.map((record) => `${record.datetime} · ${record.final_scores}\n${record.events}`).join("\n\n")}`, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});

composer.command("history", async (ctx) => {
  await ctx.reply("Request historical match data for team/player/match");
});

export default composer;
