import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { formatPrediction, logRequest, matchWithPrediction, persistenceReady } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Match prediction", data: "match:open", order: 30 });
const composer = new Composer<Ctx>();
const prompt = "Send the match ID you want to study.";
const unavailable = "Match research isn’t set up yet. Please try again when persistent storage is available.";
async function begin(ctx: Ctx, edit = false) {
  ctx.session.step = "match";
  if (edit) return ctx.editMessageText(prompt);
  return ctx.reply(prompt, { reply_markup: { force_reply: true as const, input_field_placeholder: "Enter a match ID" } });
}
composer.command("match", (ctx) => begin(ctx));
composer.callbackQuery("match:open", async (ctx) => { await ctx.answerCallbackQuery(); await begin(ctx, true); });
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "match") return next();
  const id = ctx.message.text.trim();
  if (!id) return ctx.reply("Send a match ID so I can find its prediction.");
  ctx.session.step = undefined;
  if (!persistenceReady()) return ctx.reply(unavailable);
  const result = await matchWithPrediction(id);
  if (!result) return ctx.reply("No prediction is available for that match ID. Check the ID and try again.");
  if (ctx.from) await logRequest(ctx.from.id, `match ${id}`);
  await ctx.reply(formatPrediction(result), { reply_markup: inlineKeyboard([[inlineButton("Explain this prediction", `explain:id:${id}`)], [inlineButton("Back to menu", "menu:main")]]) });
});

composer.command("match", async (ctx) => {
  await ctx.reply("Request detailed prediction for specific match by ID");
});

export default composer;
