// Основной файл запуска бота
import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from 'telegraf';
import bot from './bot/bot.js';
import { init as initDB, getDB } from './database/db.js';
import { initSchema } from './database/schema.js';

// Инициализация базы данных и бота
async function start() {
  try {
    // Инициализация базы данных
    await initDB();
    
    // Создание схемы базы данных
    const db = getDB();
    await initSchema(db);
    
    // Инициализация бота
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('Ошибка: Не указан токен Telegram бота. Пожалуйста, добавьте TELEGRAM_BOT_TOKEN в .env файл.');
      process.exit(1);
    }

    const app = new Telegraf(token);

    // Запуск бота
    bot.init(app);

    console.log('Бот запущен...');
  } catch (error) {
    console.error('Ошибка при запуске приложения:', error);
    process.exit(1);
  }
}

start();

// Обработка сигналов для graceful shutdown
process.once('SIGINT', () => {
  console.log('Остановка бота...');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('Остановка бота...');
  process.exit(0);
});