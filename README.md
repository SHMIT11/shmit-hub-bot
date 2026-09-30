# SHMIT HUB Telegram Bot

Deployment entry point: `worker.mjs`.

Standalone Telegram bot for the SHMIT COMPANY `/start` menu. The production path is the Cloudflare Worker (`worker.mjs`) receiving Telegram webhooks. `bot.mjs` remains a legacy long-polling entry point for Render/local use.

For a free deployment, use the included `worker.mjs` as a Cloudflare Worker. It receives Telegram webhooks and does not need a permanently running server.

## Free Cloudflare Workers deployment

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Create a Worker and choose **Connect to Git**. Select `SHMIT11/shmit-hub-bot` and the `main` branch.
3. Set the Worker entry point to `worker.mjs` (the included `wrangler.toml` does this automatically when using Wrangler).
4. In **Settings -> Variables and Secrets**, add these values:

```text
BOT_TOKEN=<new token from BotFather, as an encrypted secret>
TELEGRAM_WEBHOOK_SECRET=<long random value, as an encrypted secret>
ADMIN_TELEGRAM_ID=<owner Telegram numeric ID>
WELCOME_MEDIA_FILE_ID=<Telegram photo or animation file_id, preferred>
WELCOME_MEDIA_URL=<temporary public photo/animation URL>
WELCOME_MEDIA_TYPE=photo
```

The public URL variables are already in `wrangler.toml`; add them in the dashboard too if Cloudflare asks for them.

### User storage and admin notifications

The Worker uses Cloudflare D1 to record users exactly once. The unique key is `telegram_user_id`, so repeated `/start` calls do not create duplicate owner notifications. Apply the migration before deploying:

```bash
npx wrangler d1 create shmit-hub-bot
```

Copy the returned database ID into the commented `[[d1_databases]]` block in `wrangler.toml`, with `binding = "DB"`, then run:

```bash
npx wrangler d1 migrations apply shmit-hub-bot --remote
```

Do not run the migration against a production database until its ID has been checked. Existing rows are preserved by `CREATE TABLE IF NOT EXISTS`; the migration never deletes data.

The owner can send `/admin` to see the current user count. Only `ADMIN_TELEGRAM_ID` can use that command.

`WELCOME_MEDIA_FILE_ID` and `WELCOME_MEDIA_URL` are optional media sources. A Telegram `file_id` is preferred; the temporary JPG in this repository is configured through `WELCOME_MEDIA_URL`. The Worker sends one media message with the welcome text as its caption and the existing inline keyboard. Set `WELCOME_MEDIA_TYPE=animation` for a GIF/animation. If both sources are empty, `/start` safely falls back to a text message.

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

The Render/long-polling entry point does not have D1 access, so the one-time user registration and `/admin` panel are implemented in the Cloudflare Worker path. Keep only one Telegram update consumer active at a time.

Only one instance of this worker should run, otherwise Telegram long polling can conflict between instances.

## Local run

Copy `.env.example` to `.env`, add a newly issued BotFather token, then run:

```bash
npm start
```
