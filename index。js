const mineflayer = require('mineflayer');
const express = require('express');
const fetch = require('node-fetch');

// ===== HTTP 保活服务器（Render 必须有 HTTP 响应） =====
const app = express();
const PORT = process.env.PORT || 3000;

// 健康检查路由
app.get('/', (req, res) => {
  res.send('AFK 在线 - Bot is running');
});

// 启动 Express 服务器
app.listen(PORT, () => {
  console.log(`[Render] HTTP server started on port ${PORT}`);
  console.log(`[Render] Self-ping URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:' + PORT}`);
});

// ===== 配置 =====
const CONFIG = {
  host: 'joinumc.falixsrv.me',
  port: 30869,
  version: false,
  auth: 'offline', // cracked 服务器
  checkTimeoutInterval: 180000
};

// 必须随机用户名（Falix 防重名）
const BOT_USERNAME = 'UMC_AFk_' + Math.random().toString(36).slice(2, 7);
const AUTHME_PASSWORD = process.env.AUTHME_PASSWORD || 'MySuperSecurePass123!'; // 建议用环境变量

let bot;
let jumpInterval;
let reconnecting = false;

function startBot() {
  if (reconnecting) return;
  reconnecting = true;

  console.log('⏳ 正在连接服务器:', BOT_USERNAME);

  bot = mineflayer.createBot({
    ...CONFIG,
    username: BOT_USERNAME
  });

  bot.once('spawn', () => {
    console.log('✅ 已进入服务器，尝试 AuthMe 登录/注册');
    reconnecting = false;

    // 立即尝试一次
    bot.chat(`/login ${AUTHME_PASSWORD}`);
    bot.chat(`/register ${AUTHME_PASSWORD} ${AUTHME_PASSWORD}`);

    // 监听消息
    bot.on('messagestr', (msg) => {
      const m = msg.toLowerCase();
      if (m.includes('/register')) {
        console.log('→ 检测到注册提示');
        bot.chat(`/register ${AUTHME_PASSWORD} ${AUTHME_PASSWORD}`);
      }
      if (m.includes('/login')) {
        console.log('→ 检测到登录提示');
        bot.chat(`/login ${AUTHME_PASSWORD}`);
      }
      if (
        m.includes('success') ||
        m.includes('logged') ||
        m.includes('验证成功') ||
        m.includes('已登录') ||
        m.includes('welcome')
      ) {
        console.log('✅ AuthMe 验证通过，开始 AFK 模式');
        startAntiAFK();
      }
    });
  });

  bot.on('end', (reason) => {
    console.log('❌ 连接结束:', reason || '未知原因');
    reconnect();
  });

  bot.on('kicked', (reason) => {
    console.log('❌ 被踢出:', reason);
    reconnect(reason);
  });

  bot.on('error', (err) => {
    console.log('❌ 错误:', err.message || err);
    reconnect(err.message);
  });
}

function startAntiAFK() {
  if (jumpInterval) return;
  console.log('⭐ 启动防 AFK 跳跃（每 20 秒）');

  jumpInterval = setInterval(() => {
    if (!bot?.entity) return;
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 300);
  }, 20000);
}

function reconnect(reason = '未知原因') {
  console.log('🔄 准备重连，原因:', reason);
  try { bot?.quit(); } catch {}
  bot?.removeAllListeners();
  bot = null;
  if (jumpInterval) {
    clearInterval(jumpInterval);
    jumpInterval = null;
  }

  setTimeout(() => {
    reconnecting = false;
    startBot();
  }, 30000); // 30 秒后重连
}

// ===== 启动 bot =====
startBot();

// ===== 自 ping 保活（防止 Render Free 层 15 分钟休眠） =====
const RENDER_URL = process.env.RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
  : `http://localhost:${PORT}`;

setInterval(() => {
  console.log('[Ping] 自保活请求 →', RENDER_URL);
  fetch(RENDER_URL).catch(err => {
    console.log('[Ping] 自请求失败:', err.message);
  });
}, 300000); // 每 5 分钟 ping 一次
