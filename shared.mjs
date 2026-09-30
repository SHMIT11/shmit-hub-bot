export const requiredConfig = [
  "BOT_TOKEN",
  "MINI_APP_URL",
  "VPN_BOT_URL",
  "STEAM_BOT_URL",
  "STARS_BOT_URL",
  "PREMIUM_BOT_URL",
];

export const welcomeMessage = `Добро пожаловать в SHMIT COMPANY 🚀

Вся цифровая экосистема — в одном месте.

💙 SHMIT VPN — наш главный сервис для ускорения вашего интернета.

Внутри SHMIT HUB:

⚡ SHMIT Proxy — бесплатный прокси для Telegram
💳 SHMIT Pay — цифровые товары и оплата сервисов
🛍 SHMIT Market — подписки и digital-сервисы
✨ SHMIT GPT — AI-инструменты и генерация
🛒 SHMIT Shop — одежда Anteater
💼 SHMIT Business — индивидуальные digital-решения

Открывай SHMIT HUB и выбирай нужный сервис 👇`;

export function getConfig(env) {
  const config = Object.fromEntries(
    requiredConfig.map((key) => [key, env[key]?.trim() ?? ""]),
  );

  for (const key of [
    "ADMIN_TELEGRAM_ID",
    "WELCOME_MEDIA_FILE_ID",
    "WELCOME_MEDIA_URL",
    "WELCOME_MEDIA_TYPE",
  ]) {
    config[key] = env[key]?.trim() ?? "";
  }

  const missing = requiredConfig.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing bot configuration: ${missing.join(", ")}`);
  }
  return config;
}

export function mainKeyboard(config) {
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
      [
        {
          text: "🟢 SHMIT HUB",
          style: "success",
          web_app: { url: config.MINI_APP_URL },
        },
      ],
    ],
  };
}

export function getCommand(text) {
  const command = text?.trim().split(/\s+/, 1)[0]?.toLowerCase();
  return command?.split("@", 1)[0] ?? "";
}

export function welcomeRequest(config, chatId) {
  const common = {
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(config),
  };

  const media = config.WELCOME_MEDIA_FILE_ID || config.WELCOME_MEDIA_URL;
  if (!media) {
    return {
      method: "sendMessage",
      body: { ...common, text: welcomeMessage },
    };
  }

  const animation = config.WELCOME_MEDIA_TYPE.toLowerCase() === "animation";
  return {
    method: animation ? "sendAnimation" : "sendPhoto",
    body: {
      ...common,
      [animation ? "animation" : "photo"]: media,
      caption: welcomeMessage,
    },
  };
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatNewUserNotification(user, createdAt) {
  const username = user.username ? `@${user.username}` : "отсутствует";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "не указано";
  const language = user.language_code ? `\n🌐 Язык: ${escapeHtml(user.language_code)}` : "";
  const date = createdAt ? `\n🕐 Дата: ${escapeHtml(createdAt)}` : "";

  return `👤 <b>Новый пользователь SHMIT</b>

Username: ${escapeHtml(username)}
Имя: ${escapeHtml(name)}
ID: <code>${escapeHtml(user.id)}</code>${language}${date}`;
}
