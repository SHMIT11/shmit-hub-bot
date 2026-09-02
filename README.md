# SHMIT HUB Telegram Bot

Standalone Telegram bot for the SHMIT COMPANY `/start` menu. The bot uses Telegram long polling and is intended to run on Render as a **Background Worker**.

For a free deployment, use the included `worker.mjs` as a Cloudflare Worker. It receives Telegram webhooks and does not need a permanently running server.

## Free Cloudflare Workers deployment

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Create a Worker and choose **Connect to Git**. Select `SHMIT11/shmit-hub-bot` and the `main` branch.
3. Set the Worker entry point to `worker.mjs` (the included `wrangler.toml` does this automatically when using Wrangler).
4. In **Settings -> Variables and Secrets**, add these values:

```text
BOT_TOKEN=<new token from BotFather, as an encrypted secret>
TELEGRAM_WEBHOOK_SECRET=<long random value, as an encrypted secret>
```

The public URL variables are already in `wrangler.toml`; add them in the dashboard too if Cloudflare asks for them.

5. Deploy and copy the Worker URL, for example `https://shmit-hub-bot.<account>.workers.dev`.
6. Set the Telegram webhook once from a terminal. Replace the placeholders locally; do not put the token in GitHub:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://shmit-hub-bot.<account>.workers.dev/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

7. Open the bot in Telegram and send `/start`.

Cloudflare Workers Free includes a daily request allowance that is more than enough for this menu bot. Do not run the old long-polling `bot.mjs` at the same time after setting the webhook.

## Render deployment

1. Create a new GitHub repository, for example `shmit-hub-bot`.
2. Upload the files from this folder to the repository.
3. In Render choose **New +**, then **Background Worker**.
4. Connect the new GitHub repository.
5. Render can use the included `render.yaml`, or configure these values manually:

```text
Runtime: Node
Build Command: (empty)
Start Command: node bot.mjs
Plan: Starter (Background Workers are not available on Render Free)
```

6. Add `BOT_TOKEN` as a secret environment variable. Generate a new token in BotFather; never use a token that was previously shared in chat.
7. Add the remaining variables from `.env.example` or let Render apply `render.yaml`.
8. Deploy and check the worker logs for `SHMIT HUB bot is running`.

Only one instance of this worker should run, otherwise Telegram long polling can conflict between instances.

## Local run

Copy `.env.example` to `.env`, add a newly issued BotFather token, then run:

```bash
npm start
```
