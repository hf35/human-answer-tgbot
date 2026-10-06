// Основной бэкенд сервис для работы через API и веб-интерфейс
import express from 'express';
import { init as initDB, getDB } from '../database/db.js';
import { initSchema } from '../database/schema.js';
import { MessageBusinessService } from '../services/messageBusinessService.js';
import { TelegramChatService } from '../services/telegramChatService.js';

// Инициализация базы данных
async function initializeDatabase() {
  try {
    await initDB();
    const db = getDB();
    await initSchema(db);
    console.log('База данных инициализирована');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

// Создаем экземпляр сервиса чатов для веб-запросов
const telegramChatService = new TelegramChatService();
// Создаем бизнес-сервис с использованием Telegram-чата
const messageBusinessService = new MessageBusinessService(telegramChatService);

// Создаем Express приложение
const app = express();
app.use(express.json());

// Импортируем и используем веб API
import { app as webApiApp } from '../api/webApi.js';
app.use('/', webApiApp);

// Добавляем middleware для статических файлов
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../webui')));

// Добавляем маршрут для главной страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../webui/index.html'));
});

export { app, initializeDatabase };