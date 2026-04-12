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

// ====================== 加强版 AntiBot 绕过逻辑 ======================
let reconnectAttempts = 0;
const maxReconnects = 5;           // 减少尝试次数，避免被更严格限制
let inLoginPhase = false;

function createBot() {
    console.log(`${style.system} Creating bot... (Attempt ${reconnectAttempts + 1}/${maxReconnects})`);

    const bot = mineflayer.createBot({
        host: config.serverHost,
        username: config.botUsername,
        password: config.botPassword,
        version: config.mcVersion,
        auth: 'offline',
        checkTimeoutInterval: 300 * 1000,     // 5分钟超时
        hideErrors: true,
        // 增加一些客户端特征（帮助绕过部分 AntiBot）
        skipValidation: true,
        client: {
            version: config.mcVersion
        }
    });

    bot.on('messagestr', (message) => {
        console.log(`${style.system} Server: ${message}`);

        if (message.includes('/register') || message.includes('/login')) {
            inLoginPhase = true;
            console.log(`${style.system} [SUCCESS] Entered LOGIN PHASE !`);

            // 极长随机等待：25 ~ 40 秒（关键绕过点）
            const delay = 25000 + Math.random() * 15000;
            setTimeout(() => {
                console.log(`${style.system} Sending login/register command now...`);
                if (message.includes('/register')) {
                    bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
                } else {
                    bot.chat(`/login ${config.botPassword}`);
                }
            }, delay);
        }
    });

    bot.on('login', () => {
        console.log(`${style.login} Bot logged in to proxy server!`);
    });

    bot.on('spawn', () => {
        console.log(`${style.system} Bot spawned.`);
    });

    bot.on('kicked', (reason) => {
        console.log(`${style.error} Kicked by server:`);
        console.dir(reason, { depth: null });
    });

    bot.on('error', (err) => {
        console.log(`${style.error} Error: ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${style.system} Connection ended.`);
        reconnectAttempts++;

        if (reconnectAttempts < maxReconnects) {
            const delay = inLoginPhase ? 60000 : 90000;   // AntiBot 阶段等90秒
            console.log(`${style.system} Waiting ${delay/1000} seconds before reconnect...`);
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
