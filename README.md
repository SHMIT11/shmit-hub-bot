# SHMIT HUB Telegram Bot

Standalone Telegram bot for the SHMIT COMPANY `/start` menu. The bot uses Telegram long polling and is intended to run on Render as a **Background Worker**.

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
Plan: Free
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
