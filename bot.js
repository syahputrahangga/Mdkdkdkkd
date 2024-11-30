const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');

// Replace with your bot token
const TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(TOKEN, { polling: true });

// Encryption function
function encryptFile(inputFile, outputFile, password) {
  const cipher = crypto.createCipher('aes-256-cbc', password);
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  input.pipe(cipher).pipe(output);
  output.on('finish', () => {
    console.log(`File ${inputFile} encrypted successfully to ${outputFile}`);
  });
}

// Decryption function
function decryptFile(inputFile, outputFile, password) {
  const decipher = crypto.createDecipher('aes-256-cbc', password);
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  input.pipe(decipher).pipe(output);
  output.on('finish', () => {
    console.log(`File ${inputFile} decrypted successfully to ${outputFile}`);
  });
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /encrypt or /decrypt to secure your files.');
});

// Handle /encrypt command
bot.onText(/\/encrypt (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split(' ');

  if (args.length < 3) {
    bot.sendMessage(chatId, 'Usage: /encrypt <inputFilePath> <outputFilePath> <password>');
    return;
  }

  const [inputFile, outputFile, password] = args;

  try {
    encryptFile(inputFile, outputFile, password);
    bot.sendMessage(chatId, 'File encrypted successfully!');
  } catch (error) {
    bot.sendMessage(chatId, `Error encrypting file: ${error.message}`);
  }
});

// Handle /decrypt command
bot.onText(/\/decrypt (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split(' ');

  if (args.length < 3) {
    bot.sendMessage(chatId, 'Usage: /decrypt <inputFilePath> <outputFilePath> <password>');
    return;
  }

  const [inputFile, outputFile, password] = args;

  try {
    decryptFile(inputFile, outputFile, password);
    bot.sendMessage(chatId, 'File decrypted successfully!');
  } catch (error) {
    bot.sendMessage(chatId, `Error decrypting file: ${error.message}`);
  }
});
