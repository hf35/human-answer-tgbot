// Веб API для работы с ботом через HTTP
import express from 'express';
import { MessageBusinessService } from '../services/messageBusinessService.js';
import { TelegramChatService } from '../services/telegramChatService.js';
import { getDB } from '../database/db.js';
import messages from '../locales/index.js';

// Создаем экземпляр сервиса чатов для веб-запросов
const telegramChatService = new TelegramChatService();
// Создаем бизнес-сервис с использованием Telegram-чата
const messageBusinessService = new MessageBusinessService(telegramChatService);

const app = express();
app.use(express.json());

// API endpoint для отправки сообщения
app.post('/api/message', async (req, res) => {
  try {
    const { userId, messageText, receiverId } = req.body;
    
    if (!userId || !messageText) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать userId и messageText'
      });
    }

    // Текст сообщения не должен состоять только из пробелов
    const trimmedText = String(messageText).trim();
    if (!trimmedText) {
      return res.status(400).json({
        success: false,
        error: 'Текст сообщения не может быть пустым'
      });
    }
    
    // Получаем реальные данные пользователя из базы
    const user = await telegramChatService.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не зарегистрирован'
      });
    }
    
    // Приводим пользователя к формату, ожидаемому бизнес-сервисом
    const sender = {
      id: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name
    };
    
    // Если указан получатель — отправляем сообщение напрямую ему,
    // иначе используем стандартную логику (ответ или пересылка)
    const result = receiverId
      ? await messageBusinessService.sendMessageToUser(sender, receiverId, trimmedText)
      : await messageBusinessService.handleMessage(sender, trimmedText);

    // handleMessage возвращает type 'error' без выброса исключения
    // (например, когда пользователь ждёт ответа на своё сообщение).
    // В этом случае сообщение не отправлено — возвращаем ошибку.
    if (result && result.type === 'error') {
      return res.status(409).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Ошибка при обработке API запроса:', error);
    // Ошибка бизнес-правила (например, ожидание ответа) — это 409,
    // а не внутренняя ошибка сервера
    res.status(error.message && error.message !== messages.ERROR_MESSAGE_PROCESSING ? 409 : 500).json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера'
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
        success: false,
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

// API endpoint для получения всех сообщений пользователя
app.get('/api/user-messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать userId'
      });
    }
    
    // Получаем все сообщения пользователя (как отправленные, так и полученные)
    const messages = await messageBusinessService.getUserMessages(userId);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Ошибка при получении сообщений пользователя:', error);
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
    const db = getDB();

    // Добавляем количество отправленных и полученных сообщений для каждого пользователя
    const stats = await db.all(`
      SELECT
        u.telegram_id,
        (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.telegram_id) as sent_count,
        (SELECT COUNT(*) FROM messages m WHERE m.receiver_id = u.telegram_id) as received_count,
        (SELECT COUNT(*) FROM messages m WHERE m.receiver_id = u.telegram_id AND m.replied = FALSE) as unread_count,
        (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.telegram_id AND m.replied = FALSE) as awaiting_reply_count
      FROM users u
    `);

    const statsByUserId = new Map(stats.map(row => [Number(row.telegram_id), row]));

    const usersWithStats = users.map(user => {
      const userStats = statsByUserId.get(Number(user.telegram_id));
      return {
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        sent_count: userStats ? userStats.sent_count : 0,
        received_count: userStats ? userStats.received_count : 0,
        unread_count: userStats ? userStats.unread_count : 0,
        awaiting_reply_count: userStats ? userStats.awaiting_reply_count : 0
      };
    });

    res.json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

export { app };