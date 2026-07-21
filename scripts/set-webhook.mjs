// Run with: node scripts/set-webhook.mjs
// Requires env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, WORKER_URL
// Example:
//   TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_WEBHOOK_SECRET=mysecret \
//   WORKER_URL=https://predict-league-bot.yourname.workers.dev \
//   node scripts/set-webhook.mjs

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const workerUrl = process.env.WORKER_URL;

if (!token || !secret || !workerUrl) {
  console.error("Missing required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, WORKER_URL");
  process.exit(1);
}

const url = `${workerUrl.replace(/\/$/, "")}/webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url, secret_token: secret }),
});

const body = await res.json();
console.log(body);

if (!body.ok) {
  console.error("Failed to set webhook.");
  process.exit(1);
}
console.log(`✅ Webhook set to ${url}`);
