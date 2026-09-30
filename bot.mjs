import {
  getCommand,
  getConfig,
  mainKeyboard,
  welcomeRequest,
} from "./shared.mjs";

const config = getConfig(process.env);
const telegramApi = `https://api.telegram.org/bot${config.BOT_TOKEN}`;

async function telegram(method, body) {
  const response = await fetch(`${telegramApi}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

async function sendWelcome(chatId) {
  const request = welcomeRequest(config, chatId);
  try {
    return await telegram(request.method, request.body);
  } catch (error) {
    if (request.method === "sendMessage") throw error;

    console.error(`Welcome media delivery failed: ${error.message}`);
    return telegram("sendMessage", {
      chat_id: chatId,
      text: request.body.caption,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: mainKeyboard(config),
    });
  }
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
    const command = getCommand(message?.text);
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
    console.error(`Polling error: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
