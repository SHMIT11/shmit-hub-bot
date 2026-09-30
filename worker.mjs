import {
  formatNewUserNotification,
  getCommand,
  getConfig,
  mainKeyboard,
  welcomeRequest,
} from "./shared.mjs";

async function telegram(config, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Telegram API ${method} returned invalid JSON`);
  }
  if (!response.ok || !payload.ok) {
    throw new Error(`Telegram API ${method} failed with status ${response.status}`);
  }
  return payload.result;
}

async function registerUser(env, config, user) {
  if (!env.DB?.prepare || !user?.id) return false;

  const createdAt = new Date().toISOString();
  const result = await env.DB
    .prepare(
      `INSERT OR IGNORE INTO users
        (telegram_user_id, username, first_name, last_name, language_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      String(user.id),
      user.username ?? null,
      user.first_name ?? null,
      user.last_name ?? null,
      user.language_code ?? null,
      createdAt,
    )
    .run();

  const inserted = Number(result?.meta?.changes ?? 0) === 1;
  if (inserted && config.ADMIN_TELEGRAM_ID) {
    try {
      await telegram(config, "sendMessage", {
        chat_id: config.ADMIN_TELEGRAM_ID,
        text: formatNewUserNotification(user, createdAt),
        parse_mode: "HTML",
      });
    } catch (error) {
      // Admin delivery must never prevent the new user from receiving /start.
      console.error(`New-user admin notification failed: ${error.message}`);
    }
  }
  return inserted;
}

async function userCount(env) {
  if (!env.DB?.prepare) return null;
  const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  return Number(result?.count ?? 0);
}

async function sendAdminPanel(env, config, message) {
  const isAdmin =
    config.ADMIN_TELEGRAM_ID &&
    String(message.from?.id ?? "") === String(config.ADMIN_TELEGRAM_ID);

  if (!isAdmin) {
    await telegram(config, "sendMessage", {
      chat_id: message.chat.id,
      text: "Команда доступна только администратору.",
    });
    return;
  }

  const count = await userCount(env);
  await telegram(config, "sendMessage", {
    chat_id: message.chat.id,
    text:
      count === null
        ? "⚙️ Админ-панель SHMIT\n\nХранилище пользователей ещё не подключено."
        : `⚙️ <b>Админ-панель SHMIT</b>\n\nПользователей: <b>${count}</b>`,
    parse_mode: "HTML",
  });
}

async function sendWelcome(config, chatId) {
  const request = welcomeRequest(config, chatId);
  try {
    return await telegram(config, request.method, request.body);
  } catch (error) {
    if (request.method === "sendMessage") throw error;

    // A missing/invalid media file_id should not break the bot's core welcome flow.
    console.error(`Welcome media delivery failed: ${error.message}`);
    return telegram(config, "sendMessage", {
      chat_id: chatId,
      text: request.body.caption,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: mainKeyboard(config),
    });
  }
}

export default {
  async fetch(request, env) {
    if (
      request.method !== "POST" ||
      new URL(request.url).pathname !== "/telegram"
    ) {
      return new Response("Not found", { status: 404 });
    }

    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const receivedSecret = request.headers.get(
        "X-Telegram-Bot-Api-Secret-Token",
      );
      if (receivedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    try {
      const config = getConfig(env);
      const update = await request.json();
      const message = update.message;
      const command = getCommand(message?.text);

      if (!message?.chat?.id) return new Response("ok");

      if (command === "/admin") {
        await sendAdminPanel(env, config, message);
      } else if (command === "/start" || command === "/menu") {
        try {
          await registerUser(env, config, message.from);
        } catch (error) {
          // Storage errors are isolated so /start remains available to users.
          console.error(`User registration failed: ${error.message}`);
        }
        await sendWelcome(config, message.chat.id);
      }

      return new Response("ok");
    } catch (error) {
      console.error(`Webhook error: ${error.message}`);
      return new Response("Webhook error", { status: 500 });
    }
  },
};
