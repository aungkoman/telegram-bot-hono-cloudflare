// Run with: node scripts/delete-webhook.mjs
// Requires env var: TELEGRAM_BOT_TOKEN

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Missing required env var: TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
  method: "POST",
});

const body = await res.json();
console.log(body);
