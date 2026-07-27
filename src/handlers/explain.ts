import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { logRequest, matchWithPrediction, persistenceReady } from "../research-store.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Model explanation", data: "explain:open", order: 50 });
const composer = new Composer<Ctx>();
const prompt = "Send the match ID for the prediction you want explained.";
async function explain(ctx: Ctx, id: string) {
  if (!persistenceReady()) return ctx.reply("Model explanations aren’t set up yet. Please try again when persistent storage is available.");
  const result = await matchWithPrediction(id);
  if (!result) return ctx.reply("No prediction is available for that match ID. Check the ID and try again.");
  const features = (result.prediction.features ?? []).slice(0, 5);
  if (features.length === 0) return ctx.reply("This prediction has no approved explanation data yet.");
  if (ctx.from) await logRequest(ctx.from.id, `explain ${id}`);
  await ctx.reply(`Explanation for ${result.match.teams_players}\nModel version: ${result.prediction.model_version}\n\nKey factors:\n${features.map((feature, i) => `${i + 1}. ${feature}`).join("\n")}\n\nThis is a simplified research summary and does not expose proprietary model logic.`, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
}
async function begin(ctx: Ctx, edit = false) {
  ctx.session.step = "explain";
  if (edit) return ctx.editMessageText(prompt);
  return ctx.reply(prompt, { reply_markup: { force_reply: true as const, input_field_placeholder: "Enter a match ID" } });
}
composer.command("explain", (ctx) => begin(ctx));
composer.callbackQuery("explain:open", async (ctx) => { await ctx.answerCallbackQuery(); await begin(ctx, true); });
composer.callbackQuery(/^explain:id:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); await explain(ctx, ctx.match[1]); });
composer.on("message:text", async (ctx, next) => { if (ctx.session.step !== "explain") return next(); ctx.session.step = undefined; await explain(ctx, ctx.message.text.trim()); });

composer.command("explain", async (ctx) => {
  await ctx.reply("Request model explanation for specific match prediction");
});

export default composer;
