import { Hono } from "hono";
import type { Bindings, TelegramUpdate } from "../types";
import { tgClient } from "../lib/telegram";
import { ensureMembership, upsertGroup, upsertUser } from "../lib/db";
import { startMessage, HELP_TEXT } from "../commands/help";
import { handlePredict } from "../commands/predict";
import { handleFixtures, handleLeaderboard, handleMyPredictions } from "../commands/stats";

export const webhookRoute = new Hono<{ Bindings: Bindings }>();

webhookRoute.post("/webhook", async (c) => {
  // Verify the request actually came from Telegram using the secret token header.
  const secretHeader = c.req.header("x-telegram-bot-api-secret-token");
  if (secretHeader !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.text("unauthorized", 401);
  }

  const update = await c.req.json<TelegramUpdate>();
  const tg = tgClient(c.env.TELEGRAM_BOT_TOKEN);

  const message = update.message;
  if (!message || !message.text || !message.from) {
    return c.text("ok");
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const tgUser = message.from;

  // Persist user + group, and make sure a membership row exists for leaderboards.
  const userId = await upsertUser(c.env.DB, tgUser.id, tgUser.username, tgUser.first_name);
  const groupId = await upsertGroup(c.env.DB, chatId, message.chat.title);
  await ensureMembership(c.env.DB, userId, groupId);

  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();

  let reply: string;

  switch (command) {
    case "/start":
      reply = startMessage();
      break;
    case "/help":
      reply = HELP_TEXT;
      break;
    case "/predict":
      reply = await handlePredict(c.env.DB, text, userId, groupId);
      break;
    case "/fixtures":
      reply = await handleFixtures(c.env.DB);
      break;
    case "/leaderboard":
      reply = await handleLeaderboard(c.env.DB, groupId);
      break;
    case "/mypredictions":
      reply = await handleMyPredictions(c.env.DB, userId, groupId);
      break;
    default:
      // Ignore non-command chatter so the bot isn't noisy in group chats.
      return c.text("ok");
  }

  await tg.sendMessage(chatId, reply);
  return c.text("ok");
});
