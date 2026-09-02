const requiredConfig = [
  "BOT_TOKEN",
  "MINI_APP_URL",
  "VPN_BOT_URL",
  "STEAM_BOT_URL",
  "STARS_BOT_URL",
  "PREMIUM_BOT_URL",
];

const welcomeMessage = `Добро пожаловать в SHMIT COMPANY 🚀
Цифровая экосистема, где всё необходимое собрано в одном месте.

Наш главный сервис:
🔶 SHMIT VPN — Подключай VPN или бесплатный прокси для Telegram!

А ещё в SHMIT HUB:
🎮 Steam и игровые сервисы
⭐ Telegram Premium & Stars
🎵 Spotify и зарубежные подписки
🤖 AI-фотосессии
📥 Скачивание видео с любых платформ
🔄 Конвертация файлов
💳 Оплата зарубежных сервисов
📈 Продвижение и подписчики
👕 Anteater и цифровые товары
🚀 И многое друго

Открывай SHMIT HUB Mini App прямо сейчас 👇`;

function getConfig(env) {
  const config = Object.fromEntries(
    requiredConfig.map((key) => [key, env[key]?.trim() ?? ""]),
  );
  const missing = requiredConfig.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing bot configuration: ${missing.join(", ")}`);
  }
  return config;
}

function mainKeyboard(config) {
  return {
    inline_keyboard: [
      [
        { text: "🛡 Купить VPN", url: config.VPN_BOT_URL },
        { text: "🎮 Пополнить Steam", url: config.STEAM_BOT_URL },
      ],
      [
        { text: "⭐ Купить Stars", url: config.STARS_BOT_URL },
        { text: "👑 Telegram Premium", url: config.PREMIUM_BOT_URL },
      ],
      [{ text: "🟢 SHMIT HUB", web_app: { url: config.MINI_APP_URL } }],
    ],
  };
}

async function telegram(config, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(`${method} failed: ${JSON.stringify(payload)}`);
  }
  return payload.result;
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
      const command = message?.text?.trim().split(/\s+/, 1)[0];

      if (message?.chat?.id && (command === "/start" || command === "/menu")) {
        await telegram(config, "sendMessage", {
          chat_id: message.chat.id,
          text: welcomeMessage,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: mainKeyboard(config),
        });
      }

      return new Response("ok");
    } catch (error) {
      console.error(error);
      return new Response("Webhook error", { status: 500 });
    }
  },
};
