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

// API endpoint для отправки сообщения
app.post('/api/message', async (req, res) => {
  try {
    const { userId, messageText } = req.body;
    
    if (!userId || !messageText) {
      return res.status(400).json({
        error: 'Необходимо указать userId и messageText'
      });
    }
    
    // Создаем объект пользователя для веб-запроса
    const user = {
      id: userId,
      username: `web_user_${userId}`,
      firstName: `Пользователь ${userId}`,
      lastName: ''
    };
    
    // Обрабатываем сообщение через бизнес-логику
    const result = await messageBusinessService.handleMessage(user, messageText);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Ошибка при обработке API запроса:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// API endpoint для получения всех диалогов
app.get('/api/dialogs', async (req, res) => {
  try {
    // Получаем все диалоги из базы данных
    const allDialogs = await messageBusinessService.getAllDialogs();
    
    res.json({
      success: true,
      data: allDialogs
    });
  } catch (error) {
    console.error('Ошибка при получении всех диалогов:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// API endpoint для получения истории диалога
app.get('/api/dialog/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({
        error: 'Необходимо указать senderId и receiverId'
      });
    }
    
    // Получаем историю диалога
    const history = await messageBusinessService.getDialogHistory(senderId, receiverId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Ошибка при получении истории диалога:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// API endpoint для регистрации пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { userId, username, firstName, lastName } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Необходимо указать userId'
      });
    }
    
    const userData = {
      telegramId: userId,
      username: username || `web_user_${userId}`,
      firstName: firstName || `Пользователь ${userId}`,
      lastName: lastName || ''
    };
    
    // Регистрируем пользователя через чат-сервис
    await telegramChatService.createUser(userData);
    
    res.json({
      success: true,
      message: 'Пользователь зарегистрирован'
    });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// API endpoint для получения всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await telegramChatService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

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