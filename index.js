const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

// const { loader: autoEat } = require('mineflayer-auto-eat');   // 等稳定后再取消注释
// const { loader: baritone } = require('@miner-org/mineflayer-baritone');

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

console.log(`${style.system} Config loaded (Config & ${Object.keys(mobConfig).length} Mobs)`);

// -------------------------------------- time prefix
const originalLog = console.log;
console.log = (...args) => {
    const timeStr = new Date().toLocaleTimeString();
    const time = style.time(timeStr);
    if (typeof args[0] === 'string') {
        args[0] = `${time} ${args[0]}`;
    } else {
        args.unshift(time);
    }
    originalLog(...args);
};

// ====================== 核心逻辑（针对你的服务器流程优化） ======================
let reconnectAttempts = 0;
const maxReconnects = 7;
let inLoginPhase = false;     // 是否已通过 AntiBot，进入登录阶段

function createBot() {
    console.log(`${style.system} Creating bot... (Attempt ${reconnectAttempts + 1}/${maxReconnects})`);

    const bot = mineflayer.createBot({
        host: config.serverHost,
        username: config.botUsername,
        password: config.botPassword,
        version: config.mcVersion,
        auth: 'offline',
        checkTimeoutInterval: 180 * 1000,   // 增加超时
        hideErrors: true,
    });

    // 监听所有服务器消息
    bot.on('messagestr', (message) => {
        console.log(`${style.system} Server message: ${message}`);

        // 检测到登录/注册提示 → 进入登录阶段
        if (message.includes('/register') || message.includes('/login')) {
            inLoginPhase = true;
            console.log(`${style.system} === ENTERED LOGIN PHASE === Waiting long time to bypass AntiBot...`);

            // 随机等待 20~32 秒再发送密码（更像真人）
            const delay = 20000 + Math.random() * 12000;
            setTimeout(() => {
                if (message.includes('/register')) {
                    console.log(`${style.system} Sending /register command now...`);
                    bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
                } else if (message.includes('/login')) {
                    console.log(`${style.system} Sending /login command now...`);
                    bot.chat(`/login ${config.botPassword}`);
                }
            }, delay);
        }
    });

    bot.on('login', () => {
        console.log(`${style.login} Bot successfully logged in to the proxy!`);
    });

    bot.on('spawn', () => {
        console.log(`${style.system} Bot spawned.`);
        if (inLoginPhase) {
            console.log(`${style.system} Waiting for transfer to Anarchy server...`);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`${style.error} Bot was kicked:`);
        console.dir(reason, { depth: null });   // 更清晰显示踢出原因
    });

    bot.on('error', (err) => {
        console.log(`${style.error} Bot error: ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${style.system} Connection ended.`);
        reconnectAttempts++;

        if (reconnectAttempts < maxReconnects) {
            // AntiBot 阶段等更久，登录阶段等短一点
            const delay = inLoginPhase ? 50000 : 75000;
            console.log(`${style.system} Reconnecting in ${delay / 1000} seconds...`);
            setTimeout(createBot, delay);
        } else {
            console.log(`${style.error} Max reconnect attempts reached. Bot stopped.`);
        }
    });

    return bot;
}

// 启动
console.log(`${style.system} Bot is starting...`);
createBot();
