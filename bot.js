const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');

// Replace with your bot token
const BOT_TOKEN = "7622955711:AAGkopqi25sUkL-wxcsnkTBLo19gECeDHCs";

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Encryption Function
function encryptFile(inputPath, outputPath, callback) {
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16); // 128-bit IV

    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const gzip = zlib.createGzip();

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    input.pipe(cipher).pipe(gzip).pipe(output).on('finish', () => {
        callback(key, iv);
    });
}

// Decryption Function
function decryptFile(inputPath, outputPath, key, iv, callback) {
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    const gunzip = zlib.createGunzip();

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    input.pipe(gunzip).pipe(decipher).pipe(output).on('finish', callback);
}

// Start Command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome! Use /encrypt to encrypt a file or /decrypt to decrypt a file.");
});

// Encrypt Command
bot.onText(/\/encrypt/, (msg) => {
    bot.sendMessage(msg.chat.id, "Send me the file you want to encrypt.");
    bot.once('document', (fileMsg) => {
        const fileId = fileMsg.document.file_id;

        bot.getFileLink(fileId).then((fileLink) => {
            const inputPath = `${fileId}.input`;
            const outputPath = `${fileId}.output`;

            bot.downloadFile(fileId, '.').then((downloadedPath) => {
                encryptFile(downloadedPath, outputPath, (key, iv) => {
                    bot.sendDocument(msg.chat.id, outputPath, {}, {
                        filename: 'encrypted_file.enc',
                        contentType: 'application/octet-stream',
                    });

                    // Cleanup
                    fs.unlinkSync(downloadedPath);
                    fs.unlinkSync(outputPath);
                });
            });
        });
    });
});

// Decrypt Command
bot.onText(/\/decrypt/, (msg) => {
    bot.sendMessage(msg.chat.id, "Send me the encrypted file, followed by the key and IV (as text, separated by commas).");
    bot.once('document', (fileMsg) => {
        const fileId = fileMsg.document.file_id;

        bot.getFileLink(fileId).then((fileLink) => {
            const inputPath = `${fileId}.input`;
            const outputPath = `${fileId}.decrypted`;

            bot.downloadFile(fileId, '.').then((downloadedPath) => {
                bot.once('message', (keyIvMsg) => {
                    const [keyHex, ivHex] = keyIvMsg.text.split(',');
                    const key = Buffer.from(keyHex.trim(), 'hex');
                    const iv = Buffer.from(ivHex.trim(), 'hex');

                    decryptFile(downloadedPath, outputPath, key, iv, () => {
                        bot.sendDocument(msg.chat.id, outputPath, {}, {
                            filename: 'decrypted_file',
                            contentType: 'application/octet-stream',
                        });

                        // Cleanup
                        fs.unlinkSync(downloadedPath);
                        fs.unlinkSync(outputPath);
                    });
                });
            });
        });
    });
});