# Prediction League Bot ⚽️

A free-to-run Telegram bot for football score-prediction leagues among friends.
No money, no odds, no stress — just predictions, points, and a leaderboard.

Built on **Cloudflare Workers + Hono + D1**, data from the free **football-data.org**
API. Runs entirely on free tiers for small/medium groups.

---

## 1. Prerequisites

- Node.js 18+
- A Cloudflare account (free) — https://dash.cloudflare.com/sign-up
- A Telegram bot token from [@BotFather](https://t.me/BotFather) (`/newbot`)
- A free API key from https://www.football-data.org/client/register

## 2. Install dependencies

```bash
npm install
npm install -g wrangler   # if you don't already have it
wrangler login
```

## 3. Create the D1 database

```bash
wrangler d1 create predict-league-db
```

Copy the `database_id` from the output into `wrangler.toml` under
`[[d1_databases]]`.

## 4. Run the schema migration

```bash
npm run db:migrate:remote
```

(Use `db:migrate:local` too if you want to test locally with `wrangler dev`.)

## 5. Set your secrets

These are NOT stored in `wrangler.toml` — Cloudflare keeps them encrypted.

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET   # any random string you make up, e.g. via `openssl rand -hex 20`
wrangler secret put FOOTBALL_DATA_API_KEY
```

## 6. Adjust tracked competitions (optional)

Edit `wrangler.toml` → `[vars] TRACKED_COMPETITIONS`. Free-tier competition
codes include:

```
PL   Premier League       PD   La Liga         BL1  Bundesliga
SA   Serie A              FL1  Ligue 1         CL   Champions League
DED  Eredivisie           PPL  Primeira Liga   ELC  Championship
BSA  Brazil Série A       WC   World Cup       EC   European Championship
```

## 7. Deploy

```bash
npm run deploy
```

Wrangler will print your Worker URL, e.g.
`https://predict-league-bot.<your-subdomain>.workers.dev`

## 8. Point Telegram at your Worker

```bash
TELEGRAM_BOT_TOKEN=<your token> \
TELEGRAM_WEBHOOK_SECRET=<same secret you set in step 5> \
WORKER_URL=https://predict-league-bot.<your-subdomain>.workers.dev \
npm run set-webhook
```

You should see `{"ok":true,"result":true,"description":"Webhook was set"}`.

## 9. Load your first fixtures

Cron runs automatically every day at 06:00 UTC, but to test immediately you
can trigger it manually:

```bash
wrangler dev --test-scheduled
# then in another terminal:
curl "http://localhost:8787/__scheduled?cron=0+6+*+*+*"
```

Or just wait for the next scheduled run once deployed — Cloudflare Cron
Triggers run automatically in production without any extra setup.

## 10. Try it

Add your bot to a Telegram group (or DM it directly), then:

```
/start
/fixtures
/predict Arsenal-Chelsea 2-1
/leaderboard
/mypredictions
```

---

## How scoring works

| Result                              | Points |
|--------------------------------------|--------|
| Exact scoreline correct              | 3 (configurable via `POINTS_EXACT`)   |
| Correct winner/draw, wrong scoreline | 1 (configurable via `POINTS_OUTCOME`) |
| Wrong outcome                        | 0      |

A cron job checks for finished matches every 30 minutes (12:00–23:30 UTC),
scores any pending predictions, and posts an updated leaderboard to every
group that had a scored match.

## Cost breakdown (why this is free)

| Component              | Free tier limit                          |
|-------------------------|------------------------------------------|
| Cloudflare Workers       | 100,000 requests/day                     |
| Cloudflare D1            | 5 GB storage, 5M row reads/day           |
| Cloudflare Cron Triggers | Included free                            |
| Telegram Bot API         | Free, no meaningful limits for this use  |
| football-data.org        | 12 competitions, 10 req/min, free forever|

The bot never calls football-data.org on a user's command — only from
scheduled Cron jobs — so you stay far under the 10 req/min limit regardless
of how many users or groups you have.

## Project structure

```
src/
  index.ts            # Hono app entry + cron dispatcher
  types.ts            # Shared TypeScript types
  cron.ts             # Fixture sync, result sync, scoring, leaderboard posts
  routes/
    webhook.ts         # Telegram webhook endpoint
  commands/
    help.ts            # /start, /help
    predict.ts          # /predict
    stats.ts            # /fixtures, /leaderboard, /mypredictions
  lib/
    telegram.ts         # Telegram API client
    footballData.ts      # football-data.org API client
    db.ts               # D1 query helpers
    scoring.ts           # Points calculation
migrations/
  0001_init.sql         # D1 schema
scripts/
  set-webhook.mjs        # Register the Telegram webhook
  delete-webhook.mjs      # Remove it (e.g. for local polling-based dev)
```

## Extending

- Add `/streak` to track consecutive correct predictions
- Add badges for milestones (10 correct predictions, etc.)
- Add monthly leaderboard resets alongside an all-time one
- Add inline buttons for quicker predictions instead of typing scorelines



Perfect for testing and development, this takes seconds and requires no configuration.Setup: Download the cloudflared CLI.Command: Run cloudflared tunnel --url localhost:8000 in your terminal.Result: Cloudflare will instantly generate a free, secure trycloudflare.com URL that routes to your local application

winget install --id Cloudflare.cloudflared

cloudflared tunnel login

cloudflared tunnel create my-worker-tunnel


Tunnel credentials written to C:\Users\aungk\.cloudflared\d0d80833-fec5-4cf5-be20-6e669b56d877.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel my-worker-tunnel with id d0d80833-fec5-4cf5-be20-6e669b56d877


C:\Users\aungk>cloudflared tunnel --url http://127.0.0.1:8787
2026-07-21T10:02:28Z INF Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out. However, be aware that these account-less Tunnels have no uptime guarantee, are subject to the Cloudflare Online Services Terms of Use (https://www.cloudflare.com/website-terms/), and Cloudflare reserves the right to investigate your use of Tunnels for violations of such terms. If you intend to use Tunnels in production you should use a pre-created named tunnel by following: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
2026-07-21T10:02:28Z INF Requesting new quick Tunnel on trycloudflare.com...
2026-07-21T10:02:34Z INF +--------------------------------------------------------------------------------------------+
2026-07-21T10:02:34Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2026-07-21T10:02:34Z INF |  https://belly-reprints-twiki-fort.trycloudflare.com                                       |
2026-07-21T10:02:34Z INF +--------------------------------------------------------------------------------------------+
2026-07-21T10:02:34Z INF Cannot determine default configuration path. No file [config.yml config.yaml] in [~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp]
2026-07-21T10:02:34Z INF Version 2026.7.2 (Checksum cdb5d4432f6ae1595654a692a51308b69d2bf7af961f5578d9391837cf072df9)
2026-07-21T10:02:34Z INF GOOS: windows, GOVersion: go1.26.4, GoArch: amd64
2026-07-21T10:02:34Z INF Settings: map[ha-connections:1 protocol:quic url:http://127.0.0.1:8787]
2026-07-21T10:02:34Z INF cloudflared will not automatically update on Windows systems.

npm install ngrok -g

ngrok http 8787

ngrok token

https://dashboard.ngrok.com/get-started/your-authtoken 
35dTAsqccklPwq4mEX6RdjUNbn0_38k2PPbBPeHP4QifEe8MQ
ngrok config add-authtoken $YOUR_AUTHTOKEN
ngrok config add-authtoken 35dTAsqccklPwq4mEX6RdjUNbn0_38k2PPbBPeHP4QifEe8MQ


https://marylou-intervascular-arcuately.ngrok-free.dev/


https://api.telegram.org/8959726882:AAHh32Ti0PdildIznVdGTcB0C3Ai_rEJG5M/setWebhook?url=https://marylou-intervascular-arcuately.ngrok-free.dev/webhook&secret_token=any-random-secret-string


## Open In Browser


```json
{
"ok": true,
"result": true,
"description": "Webhook was set"
}
```

BOT URL  https://t.me/myan_bet_bot

https://api.telegram.org/bot8959726882:AAHh32Ti0PdildIznVdGTcB0C3Ai_rEJG5M/setWebhook?url=https://marylou-intervascular-arcuately.ngrok-free.dev/webhook&secret_token=any-random-secret-string


https://api.telegram.org/bot8959726882:AAHh32Ti0PdildIznVdGTcB0C3Ai_rEJG5M/setWebhook?url=https://predict-league-bot.aungkoman.workers.dev/webhook&secret_token=any-random-secret-string



curl.exe -X GET "https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-07-10&dateTo=2026-07-20&status=FINISHED" `
  -H "X-Auth-Token: 17da241c4c3d43dbaa1990f9315fa1d5"

npm run dev -- --test-scheduled
# (or: npx wrangler dev --test-scheduled)

curl.exe -X GET "https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-07-20&dateTo=2026-07-30" `
  -H "X-Auth-Token: 17da241c4c3d43dbaa1990f9315fa1d5"

PS D:\Cisco\Code\CloudFlare\predict-league-bot\predict-league-bot> wrangler dev --test-scheduled

 ⛅️ wrangler 4.105.0
────────────────────

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
Using secrets defined in .dev.vars
Your Worker has access to the following bindings:
Binding                                              Resource                  Mode
env.DB (predict-league-db)                           D1 Database               local
env.TRACKED_COMPETITIONS ("PL,CL")                   Environment Variable      local
env.POINTS_EXACT ("3")                               Environment Variable      local
env.POINTS_OUTCOME ("1")                             Environment Variable      local
env.TELEGRAM_BOT_TOKEN ("(hidden)")                  Environment Variable      local
env.TELEGRAM_WEBHOOK_SECRET ("(hidden)")             Environment Variable      local
env.FOOTBALL_DATA_API_KEY ("(hidden)")               Environment Variable      local
env.WORKER_URL ("(hidden)")                          Environment Variable      local

╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
Using vars defined in .dev.vars
Your Worker and resources are simulated locally via Miniflare. For more information, see: https://developers.cloudflare.com/workers/testing/local-development.

Your worker has access to the following bindings:
- D1 Databases:
  - DB: predict-league-db (280dbd9b-c261-4bfe-93e4-a2e7e5929c3f) [simulated locally]
- Vars:
  - TRACKED_COMPETITIONS: "PL,CL"
  - POINTS_EXACT: "3"
  - POINTS_OUTCOME: "1"
  - TELEGRAM_BOT_TOKEN: "(hidden)"
  - TELEGRAM_WEBHOOK_SECRET: "(hidden)"
  - FOOTBALL_DATA_API_KEY: "(hidden)"
  - WORKER_URL: "(hidden)"
--------------------
💡 Recommendation: for development, use a preview D1 database rather than the one you'd use in production.
💡 Create a new D1 database with "wrangler d1 create <name>" and add its id as preview_database_id to the d1_database "DB" in your wrangler.toml file
--------------------

Using vars defined in .dev.vars
Your worker has access to the following bindings:
- D1 Databases:
  - DB: predict-league-db (280dbd9b-c261-4bfe-93e4-a2e7e5929c3f)
- Vars:
  - TRACKED_COMPETITIONS: "PL,CL"
  - POINTS_EXACT: "3"
  - POINTS_OUTCOME: "1"
  - TELEGRAM_BOT_TOKEN: "(hidden)"
  - TELEGRAM_WEBHOOK_SECRET: "(hidden)"
  - FOOTBALL_DATA_API_KEY: "(hidden)"
  - WORKER_URL: "(hidden)"
[wrangler:inf] Ready on http://127.0.0.1:57931
▲ [WARNING] DevTools is not available in remote mode


▲ [WARNING] DevTools is not available in remote mode


curl.exe "http://localhost:8787/__scheduled?cron=0+6+*+*+*"
Ran scheduled event


PS D:\Cisco\Code\CloudFlare\predict-league-bot\predict-league-bot> npm run deploy

> predict-league-bot@1.0.0 deploy
> wrangler deploy


 ⛅️ wrangler 3.114.17 (update available 4.112.0)
----------------------------------------------------------

▲ [WARNING] The version of Wrangler you are using is now out-of-date.

  Please update to the latest version to prevent critical errors.
  Run `npm install --save-dev wrangler@4` to update to the latest version.
  After installation, run Wrangler with `npx wrangler`.


Total Upload: 101.46 KiB / gzip: 25.10 KiB
Worker Startup Time: 18 ms
Your worker has access to the following bindings:
- D1 Databases:
  - DB: predict-league-db (280dbd9b-c261-4bfe-93e4-a2e7e5929c3f)
- Vars:
  - TRACKED_COMPETITIONS: "PL,CL"
  - POINTS_EXACT: "3"
  - POINTS_OUTCOME: "1"
Uploaded predict-league-bot (5.75 sec)
Deployed predict-league-bot triggers (4.92 sec)
  https://predict-league-bot.aungkoman.workers.dev
  schedule: 0 6 * * *
  schedule: */30 12-23 * * *
Current Version ID: aa1f35df-3c34-434c-b9c2-812b87df1288
PS D:\Cisco\Code\CloudFlare\predict-league-bot\predict-league-bot>

