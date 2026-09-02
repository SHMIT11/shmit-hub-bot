const requiredConfig = [
  "BOT_TOKEN",
  "MINI_APP_URL",
  "VPN_BOT_URL",
  "STEAM_BOT_URL",
  "STARS_BOT_URL",
  "PREMIUM_BOT_URL",
];

const config = Object.fromEntries(
  requiredConfig.map((key) => [key, process.env[key]?.trim() ?? ""]),
);

const missingConfig = requiredConfig.filter((key) => !config[key]);
if (missingConfig.length > 0) {
  throw new Error(`Missing bot configuration: ${missingConfig.join(", ")}`);
}

const telegramApi = `https://api.telegram.org/bot${config.BOT_TOKEN}`;

const welcomeMessage = `Добро пожаловать в SHMIT COMPANY 🚀

Цифровая экосистема, где всё необходимое собрано в одном месте.


Наш главный сервис:


🔶 SHMIT VPN — Подключай VPN или бесплатный прокси для Telegram!


А ещё в SHMIT HUB:


• 🎮 Steam и игровые сервисы
• ⭐ Telegram Premium & Stars
• 🎵 Spotify и зарубежные подписки
• 🤖 AI-фотосессии
• 📥 Скачивание видео с любых платформ
• 🔄 Конвертация файлов
• 💳 Оплата зарубежных сервисов
• 📈 Продвижение и подписчики
• 👕 Anteater и цифровые товары
• 🚀 И многое другое


Открывай SHMIT HUB Mini App прямо сейчас 👇`;

function mainKeyboard() {
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

async function telegram(method, body) {
  const response = await fetch(`${telegramApi}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(`${method} failed: ${JSON.stringify(payload)}`);
  }
  return payload.result;
}

async function sendWelcome(chatId) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text: welcomeMessage,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(),
  });
}

let offset = 0;

async function poll() {
  const updates = await telegram("getUpdates", {
    offset,
    timeout: 25,
    allowed_updates: ["message"],
  });

  for (const update of updates) {
    offset = update.update_id + 1;
    const message = update.message;
    const command = message?.text?.trim().split(/\s+/, 1)[0];
    if (message?.chat?.id && (command === "/start" || command === "/menu")) {
      await sendWelcome(message.chat.id);
    }
  }
}

console.log("SHMIT HUB bot is running");

while (true) {
  try {
    await poll();
  } catch (error) {
    console.error(error);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
