import { Hono } from "hono";
import type { Bindings } from "./types";
import { webhookRoute } from "./routes/webhook";
import { syncFixtures, syncResultsAndScore } from "./cron";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Prediction League Bot is running ⚽️"));

app.route("/", webhookRoute);

export default {
  fetch: app.fetch,

  // Cron triggers configured in wrangler.toml:
  //   "0 6 * * *"        -> daily fixture sync
  //   "*/30 12-23 * * *" -> periodic results check + scoring during match hours
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    if (event.cron === "0 6 * * *") {
      ctx.waitUntil(syncFixtures(env));
    } else {
      ctx.waitUntil(syncResultsAndScore(env));
    }
  },
};
