const mineflayer = require('mineflayer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');
const { loader: autoEat } = require('mineflayer-auto-eat');
const { loader: baritone } = require('@miner-org/mineflayer-baritone');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const configPath = path.join(__dirname, 'config.json');
const mobConfigPath = path.join(__dirname, 'mobConfig.json');

// -------------------------------------- chalk style color definitions

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

let killAura = false;
let autoTotem = true;
let noTotems = false;
let isDrinkingOminous = false;

// -------------------------------------- time for chat and console.log

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

// -------------------------------------- hot-reload functions

function hotReload(path, label) {
    try {
        const data = fs.readFileSync(path, 'utf8');
        console.log(`${style.system} ${label} was reloaded`);
        return JSON.parse(data);
    } catch (err) {
        console.log(`${style.error} Reloading ${label} failed: ${err.message}`);
        return null; 
    }
}

fs.watchFile(configPath, (curr, prev) => {
    if (curr.mtime <= prev.mtime) return;
    const newData = hotReload(configPath, 'Config');
    if (newData) config = newData;
});

fs.watchFile(mobConfigPath, (curr, prev) => {
    if (curr.mtime <= prev.mtime) return;
    const newData = hotReload(mobConfigPath, 'MobConfig');
    if (newData) mobConfig = newData;
});

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

// -------------------------------------- register / login

bot.once('messagestr', (message) => {
  
  if (message.includes('/register')) {
    console.log(`${style.system} Please register using /register <password> <password>`);
    setTimeout(() => {
    bot.chat(`/register ${config.botPassword} ${config.botPassword}`);
    }, 2000);

    } else if (message.includes('/login')) {
    console.log(`${style.system} Please login using /login <password>`);
    setTimeout(() => {
    bot.chat(`/login ${config.botPassword}`);
    }, 2000);
  }
});
