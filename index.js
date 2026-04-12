const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const style = {
  login: chalk.green.bold('[LOGIN]'),
  system: chalk.magenta.bold('[SYSTEM]'),
  error: chalk.red.bold('[ERROR]'),
  time: (t) => chalk.blueBright(`[${t}]`)
};

function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log(`${style.error} Error loading ${filePath}: ${err.message}`);
        return {};
    }
}

let config = loadJSON(path.join(__dirname, 'config.json'));

console.log(`${style.system} Config loaded`);

// 时间前缀
const originalLog = console.log;
console.log = (...args) => {
    const timeStr = new Date().toLocaleTimeString();
    const time = style.time(timeStr);
    if (typeof args[0] === 'string') args[0] = `${time} ${args[0]}`;
    else args.unshift(time);
    originalLog(...args);
};

let reconnectAttempts = 0;
const maxReconnects = 3;   // 只尝试3次，避免被拉黑

function createBot() {
    console.log(`${style.system} Creating bot... (Attempt ${reconnectAttempts + 1}/${maxReconnects})`);

    const bot = mineflayer.createBot({
        host: config.serverHost,
        username: config.botUsername,
        password: config.botPassword,
        version: config.mcVersion,
        auth: 'offline',
        checkTimeoutInterval: 300 * 1000,
        hideErrors: true,
        skipValidation: true
    });

    bot.on('messagestr', (message) => {
        console.log(`${style.system} Server: ${message}`);

        if (message.includes('/register') || message.includes('/login')) {
            console.log(`${style.system} [LOGIN PHASE] Detected - Waiting EXTREMELY long time...`);

            // 极端等待：40 ~ 65 秒
            const delay = 40000 + Math.random() * 25000;
            setTimeout(() => {
                console.log(`${style.system} Sending login command NOW...`);
                bot.chat(`/login ${config.botPassword}`);
            }, delay);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`${style.error} Kicked:`);
        console.dir(reason, { depth: null });
    });

    bot.on('end', () => {
        console.log(`${style.system} Connection ended.`);
        reconnectAttempts++;

        if (reconnectAttempts < maxReconnects) {
            const delay = 130000;   // 130秒 ≈ 2分10秒
            console.log(`${style.system} Waiting ${delay/1000} seconds before next attempt...`);
            setTimeout(createBot, delay);
        } else {
            console.log(`${style.error} Max attempts reached. Stopping.`);
        }
    });

    return bot;
}

console.log(`${style.system} Bot is starting...`);
createBot();
