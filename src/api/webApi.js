// Веб API для работы с ботом через HTTP
import express from 'express';
import { MessageBusinessService } from '../services/messageBusinessService.js';
import { TelegramChatService } from '../services/telegramChatService.js';

// Создаем экземпляр сервиса чатов для веб-запросов
const telegramChatService = new TelegramChatService();
// Создаем бизнес-сервис с использованием Telegram-чата
const messageBusinessService = new MessageBusinessService(telegramChatService);

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

export { app };