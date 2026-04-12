const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const configPath = path.join(__dirname, 'config.json');
const mobConfigPath = path.join(__dirname, 'mobConfig.json');

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

let config = loadJSON(configPath);
let mobConfig = loadJSON(mobConfigPath) || {};

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

// ====================== 更强 AntiBot 绕过版 ======================
let reconnectAttempts = 0;
const maxReconnects = 4;        // 减少次数，避免被封更久
let inLoginPhase = false;

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

    // 连接后先等待很久（模拟玩家加载）
    bot.once('spawn', () => {
        console.log(`${style.system} Bot spawned - waiting long time before any action...`);
        // 额外等待 15 秒
        setTimeout(() => {
            console.log(`${style.system} Ready to listen for messages`);
        }, 15000);
    });

    bot.on('messagestr', (message) => {
        console.log(`${style.system} Server: ${message}`);

        if (message.includes('/register') || message.includes('/login')) {
            inLoginPhase = true;
            console.log(`${style.system} [LOGIN PHASE] Detected! Waiting very long time...`);

            // 极长等待：30 ~ 50 秒
            const delay = 30000 + Math.random() * 20000;
            setTimeout(() => {
                console.log(`${style.system} Sending password now...`);
                if (message.includes('/register')) {
                    bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
                } else {
                    bot.chat(`/login ${config.botPassword}`);
                }
            }, delay);
        }
    });

    bot.on('login', () => {
        console.log(`${style.login} Bot logged in!`);
    });

    bot.on('kicked', (reason) => {
        console.log(`${style.error} Bot was kicked:`);
        console.dir(reason, { depth: null });
    });

    bot.on('error', (err) => {
        console.log(`${style.error} Error: ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${style.system} Connection ended.`);
        reconnectAttempts++;

        if (reconnectAttempts < maxReconnects) {
            const delay = inLoginPhase ? 70000 : 110000;   // AntiBot 阶段等 110 秒（接近2分钟）
            console.log(`${style.system} Waiting ${delay/1000} seconds before next attempt...`);
            setTimeout(createBot, delay);
        } else {
            console.log(`${style.error} Max attempts reached. Bot stopped.`);
        }
    });

    return bot;
}

// 启动
console.log(`${style.system} Bot is starting...`);
createBot();
