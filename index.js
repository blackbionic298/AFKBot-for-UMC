const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const configPath = path.join(__dirname, 'config.json');
const mobConfigPath = path.join(__dirname, 'mobConfig.json');

// -------------------------------------- chalk style
const style = {
  botColor: chalk.yellow.bold,
  userColor: chalk.yellow.bold,
  login: chalk.green.bold('[LOGIN]'),
  chat: chalk.whiteBright.bold('[CHAT]'),
  whisper: chalk.magenta.bold('[WHISPER]'),
  system: chalk.magenta.bold('[SYSTEM]'),
  cmd: chalk.cyanBright.bold('[CMD]'),
  denied: chalk.red.bold('[DENIED]'),
  error: chalk.red.bold('[ERROR]'),
  time: (t) => chalk.blueBright(`[${t}]`)
};

function loadJSON(path) {
    try {
        const data = fs.readFileSync(path, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log(`${style.error} Error loading ${path}: ${err.message}`);
        return {};
    }
}

let config = loadJSON(configPath);
let mobConfig = loadJSON(mobConfigPath);
console.log(`${style.system} Config loaded (Config & ${Object.keys(mobConfig).length} Mobs)`);

// -------------------------------------- time prefix for console.log
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

// -------------------------------------- create bot
const bot = mineflayer.createBot({
  host: config.serverHost,
  username: config.botUsername,
  password: config.botPassword,
  version: config.mcVersion,
  auth: 'offline',
  checkTimeoutInterval: 60 * 1000,
  hideErrors: true,
});

// -------------------------------------- auto register / login
bot.once('messagestr', (message) => {
  if (message.includes('/register')) {
    console.log(`${style.system} Detected register prompt, sending...`);
    setTimeout(() => {
      bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
    }, 2000);
  } 
  else if (message.includes('/login')) {
    console.log(`${style.system} Detected login prompt, sending...`);
    setTimeout(() => {
      bot.chat(`/login ${config.botPassword}`);
    }, 2000);
  }
});

console.log(`${style.system} Bot is starting...`);
// 保持 bot 运行 + 基础事件监听
bot.on('login', () => {
  console.log(`${style.login} Bot logged in successfully!`);
  console.log(`${style.system} Connected to ${config.serverHost}`);
});

bot.on('spawn', () => {
  console.log(`${style.system} Bot has spawned in the world!`);
});

bot.on('kicked', (reason) => {
  console.log(`${style.error} Bot was kicked: ${reason}`);
});

bot.on('error', (err) => {
  console.log(`${style.error} Bot error: ${err.message}`);
});

bot.on('end', () => {
  console.log(`${style.system} Bot disconnected.`);
});
