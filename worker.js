// -------------------------------------- //
// ---------- Insert Your Data ---------- //
// -------------------------------------- //

const BOT_TOKEN = "BOT_TOKEN"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "BOT_SECRET"; // Insert a powerful secret text ( only [A-Z, a-z, 0-9, _, -] are allowed).
const BOT_OWNER = 123456789; // Insert your telegram account id.

// ----------------------------------- //
// ---------- Do Not Modify ---------- //
// ----------------------------------- //

const HEADERS_ERRR = {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'};
const ERROR_404 = { 'action':'error', 'status': 404, 'text': 'Nothing to see here.', "credit": "https://github.com/vauth/chatlogger"};

// ------------------------------------ //
// ---------- Event Listener ---------- //
// ------------------------------------ //

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
     
    if (url.pathname === BOT_WEBHOOK) {return Bot.handleWebhook(event)}
    if (url.pathname === '/registerWebhook') {return Bot.registerWebhook(event, url, BOT_WEBHOOK, BOT_SECRET)}
    if (url.pathname === '/unregisterWebhook') {return Bot.unregisterWebhook(event)}
    if (url.pathname === '/getMe') {return new Response(JSON.stringify(await Bot.getMe()), {headers: HEADERS_ERRR, status: 202})}
    
    return new Response(JSON.stringify(ERROR_404), {status: 200, headers: HEADERS_ERRR});
}

// ------------------------------------ //
// ---------- Telegram Class ---------- // 
// ------------------------------------ //

class Bot {
  static async handleWebhook(event) {
    if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
      return new Response('Unauthorized', { status: 403 })
    }
    const update = await event.request.json()
    event.waitUntil(this.Update(event, update))
    return new Response('Ok')
  }

  static async registerWebhook(event, requestUrl, suffix, secret) {
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
    const response = await fetch(await this.apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))
    return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
  }

  static async unregisterWebhook(event) { 
    const response = await fetch(await this.apiUrl('setWebhook', { url: '' }))
    return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
  }

  static async getMe() {
    const response = await fetch(await this.apiUrl('getMe'))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendMessage(chat_id, text, reply_id, reply_markup=[]) {
    const response = await fetch(await this.apiUrl('sendMessage', {chat_id: chat_id, reply_to_message_id: reply_id, parse_mode: 'HTML', text, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendStciker(chat_id, sticker, reply_id, reply_markup=[], caption="") {
    const response = await fetch(await this.apiUrl('sendSticker', {chat_id: chat_id, sticker: sticker, reply_to_message_id: reply_id, parse_mode: 'HTML', caption: caption, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendPhoto(chat_id, photo, reply_id, reply_markup=[], caption="") {
    const response = await fetch(await this.apiUrl('sendPhoto', {chat_id: chat_id, photo: photo, reply_to_message_id: reply_id, parse_mode: 'HTML', caption: caption, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendDocument(chat_id, document, reply_id, reply_markup=[], caption="") {
    const response = await fetch(await this.apiUrl('sendDocument', {chat_id: chat_id, document: document, reply_to_message_id: reply_id, parse_mode: 'HTML', caption: caption, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async deleteMessage(chat_id, message_id) {
    const response = await fetch(await this.apiUrl('deleteMessage', {'chat_id': chat_id, 'message_id': message_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async getConnection(connection_id) {
    const response = await fetch(await this.apiUrl('getBusinessConnection', {'business_connection_id': connection_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async apiUrl(methodName, params = null) {
      let query = ''
      if (params) {query = '?' + new URLSearchParams(params).toString()}
      return `https://api.telegram.org/bot${BOT_TOKEN}/${methodName}${query}`
  }

  static async Update(event, update) {
    if (update.business_message) {await onBusiness(event, update.business_message)}
    if ('message' in update) {await onMessage(event, update.message)}
  }
}

// ------------------------------------- //
// ---------- Business Handler ---------- //
// ------------------------------------ //

async function onBusiness(event, message) {
  const user_id = message.from.id; let fID;
  const first_name = message.from.first_name;
  const user_name = message.from.username;
  const message_id = message.message_id;
  const chat_id = (await Bot.getConnection(message.business_connection_id)).user.id;
  const message_text = message.text || message.caption;

  if (user_id == BOT_OWNER) {return}
  if (chat_id != BOT_OWNER) {return}

  const caption = `<b>Name:</b> ${first_name}\n<b>Username:</b> @${user_name}\n<b>ID:</b> <code>${user_id}</code>\n\n<b>Text:</b> ${message_text}`;
  const button = [[{ text: first_name, url: `tg://openmessage?user_id=${user_id}&message_id=${message_id}` }]];

  if (message.document) {
    fID = message.document.file_id;
    return await Bot.sendDocument(BOT_OWNER, fID, 0, button, caption)
  } else if (message.audio) {
    fID = message.audio.file_id;
    return await Bot.sendDocument(BOT_OWNER, fID, 0, button, caption)
  } else if (message.video) {
    fID = message.video.file_id;
    return await Bot.sendDocument(BOT_OWNER, fID, 0, button, caption)
  } else if (message.photo) {
    fID = message.photo[message.photo.length - 1].file_id;
    return await Bot.sendPhoto(BOT_OWNER, fID, 0, button, caption)
  } else if (message.sticker) {
    fID = message.sticker.file_id;
    return await Bot.sendStciker(BOT_OWNER, fID, 0, button, caption)
  } else {
    return Bot.sendMessage(BOT_OWNER, caption, 0, button)
  }
}

// ------------------------------------- //
// ---------- Message Handler ---------- //
// ------------------------------------ //

async function onMessage(event, message) {
  const chat_id = message.chat.id;
  const message_id = message.message_id;

  if (message.text && message.text.startsWith("/start")) {
    const text = "This bot is currently not functioning, use it at your own risk."; // Don't ask why I wrote that ¯\[ツ]/¯ .
    const buttons = [[{ text: "Update", url: "https://t.me/execal" }]];
    return await Bot.sendMessage(chat_id, text, message_id, buttons)
  }
}
