import { ChatGPTAPI } from 'chatgpt';
import WhatsAppWebJS from 'whatsapp-web.js';
import QRCode from 'qrcode-terminal';

const { Client, LocalAuth } = WhatsAppWebJS;
const botOptions = {
  authStrategy: new LocalAuth(),
}

if (process.env.ENVIRONMENT == 'docker') {
  // No GUI env
  botOptions['puppeteer'] = {
		args: ['--no-sandbox'],
	}
}

const bot = new Client(botOptions);
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

bot.on('qr', (qr) => {
  QRCode.generate(qr, {
    small: true
  });
});

bot.on('authenticated', session => {    
  console.log('Bot is authenticated...')
});

bot.on('auth_failure', msg => {
  // Fired if session restore was unsuccessful
  console.error('Authentication error:', msg);
});

bot.on('ready', () => {
  console.log('Bot is ready to receive messages.');
});

bot.on('message', message => {
  let markdown = false;
  if(message.body.indexOf('code') >= 0 || message.body.indexOf('código') >= 0) {
    markdown = true;
  }

  (async () => {
    const chatgptAPI = new ChatGPTAPI({
      sessionToken: process.env.CHATGPT_SESSION_TOKEN,
      markdown
    });

    await chatgptAPI.ensureAuth();
    let response = null;
    try {
      response = await chatgptAPI.sendMessage(message.body);
    } catch (err) {
      console.error(err);
    }

    if (response) {
      await sleep(5000);
      message.reply(response);
    } else {
      console.log(message);
      message.reply('Bot is unavailable right now, help is on the way...')
    }
  })();
});

bot.initialize();
