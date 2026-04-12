const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const configPath = path.join(__dirname, 'config.json');
const mobConfigPath = path.join(__dirname, 'mobConfig.json');

// -------------------------------------- chalk style
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

// ====================== AntiBot 加强版 ======================
let reconnectAttempts = 0;
const maxReconnects = 5;
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
        // 下面这行可以帮助绕过部分 AntiBot
        skipValidation: true
    });

    // 监听服务器消息
    bot.on('messagestr', (message) => {
        console.log(`${style.system} Server: ${message}`);

        if (message.includes('/register') || message.includes('/login')) {
            inLoginPhase = true;
            console.log(`${style.system} [IMPORTANT] Entered LOGIN PHASE`);

            // 长时间随机等待（25~42秒）
            const delay = 25000 + Math.random() * 17000;
            setTimeout(() => {
                console.log(`${style.system} Sending password command now...`);
                if (message.includes('/register')) {
                    bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
                } else {
                    bot.chat(`/login ${config.botPassword}`);
                }
            }, delay);
        }
    });

    bot.on('login', () => {
        console.log(`${style.login} Bot logged in successfully!`);
    });

    bot.on('spawn', () => {
        console.log(`${style.system} Bot spawned in the world.`);
    });

    bot.on('kicked', (reason) => {
        console.log(`${style.error} Bot was kicked:`);
        console.dir(reason, { depth: null });
    });

    bot.on('error', (err) => {
        console.log(`${style.error} Bot error: ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${style.system} Connection ended.`);
        reconnectAttempts++;

        if (reconnectAttempts < maxReconnects) {
            const delay = inLoginPhase ? 60000 : 90000;   // AntiBot 阶段等90秒
            console.log(`${style.system} Waiting ${delay/1000} seconds before next attempt...`);
            setTimeout(createBot, delay);
        } else {
            console.log(`${style.error} Max reconnect attempts reached. Stopping.`);
        }
    });

    return bot;
}

// 启动
console.log(`${style.system} Bot is starting...`);
createBot();
