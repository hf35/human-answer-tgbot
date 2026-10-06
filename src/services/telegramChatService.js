// Реализация сервиса чатов для Telegram
import { IChatService } from './chatService.js';
import { getUser, createUser, getAllUsers } from './userService.js';
import { getDB } from '../database/db.js';
import messages from '../locales/index.js';

export class TelegramChatService extends IChatService {
  /**
   * Отправить сообщение пользователю через Telegram
   * @param {Object} recipient - информация о получателе
   * @param {string} messageText - текст сообщения
   * @returns {Promise<void>}
   */
  async sendMessage(recipient, messageText) {
    // В реальной реализации здесь будет логика отправки сообщения через Telegram API
    // Для примера просто возвращаем успешный результат
    return Promise.resolve();
  }

  /**
   * Получить пользователя по ID
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object|null>}
   */
  async getUser(userId) {
    try {
      const user = await getUser(userId);
      return user;
    } catch (error) {
      console.error('Ошибка при получении пользователя:', error);
      throw error;
    }
  }

  /**
   * Создать нового пользователя
   * @param {Object} userData - данные пользователя
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    try {
      const user = await createUser(userData);
      return user;
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw error;
    }
  }

  /**
   * Получить всех пользователей
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    try {
      const users = await getAllUsers();
      return users;
    } catch (error) {
      console.error('Ошибка при получении списка пользователей:', error);
      throw error;
    }
  }

  /**
   * Переслать сообщение через Telegram
   * @param {Object} sender - отправитель
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>}
   */
  async forwardMessage(sender, messageText) {
    try {
      // Получаем информацию о пользователе
      let user = await this.getUser(sender.id);
      
      // Если пользователь не зарегистрирован, возвращаем ошибку
      if (!user) {
        throw new Error('Пользователь не зарегистрирован');
      }
      
      // Получаем список пользователей (кроме отправителя)
      const users = await this.getAllUsers();
      const availableUsers = users.filter(user => user.telegram_id !== sender.id);
      
      if (availableUsers.length === 0) {
        throw new Error('Нет доступных пользователей для пересылки');
      }
      
      // Выбираем случайного получателя
      const receiver = this.getRandomUser(availableUsers);
      
      // Сохраняем информацию о пересылке
      const db = getDB();
      const result = await db.run(
        'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
        [sender.id, receiver.telegram_id, messageText]
      );
      
      // Возвращаем информацию о созданном сообщении
      return {
        id: result.lastID,
        sender_id: sender.id,
        receiver_id: receiver.telegram_id,
        message_text: messageText,
        forwarded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ошибка при пересылке сообщения:', error);
      throw error;
    }
  }

  /**
   * Ответить на сообщение через Telegram
   * @param {Object} user - пользователь, который отвечает
   * @param {string} replyText - текст ответа
   * @returns {Promise<void>}
   */
  async replyToLastMessage(user, replyText) {
    try {
      // Получаем последнее непрочитанное сообщение для пользователя
      const db = getDB();
      const lastUnrepliedMessage = await db.get(
        'SELECT * FROM messages WHERE receiver_id = ? AND replied = FALSE ORDER BY forwarded_at DESC LIMIT 1',
        [user.id]
      );
      
      if (!lastUnrepliedMessage) {
        // Если нет непрочитанных сообщений, отправляем как новое сообщение
        await this.forwardMessage(user, replyText);
        return;
      }
      
      // Обновляем сообщение как отвеченный
      await db.run(
        'UPDATE messages SET replied = TRUE WHERE id = ?', 
        [lastUnrepliedMessage.id]
      );
      
    } catch (error) {
      console.error('Ошибка при ответе на сообщение:', error);
      throw error;
    }
  }

  /**
   * Получить непрочитанные сообщения
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>}
   */
  async getUnrepliedMessages(userId) {
    try {
      const db = getDB();
      const messages = await db.all(
        'SELECT * FROM messages WHERE receiver_id = ? AND replied = FALSE ORDER BY forwarded_at DESC',
        [userId]
      );
      return messages;
    } catch (error) {
      console.error('Ошибка при получении непрочитанных сообщений:', error);
      throw error;
    }
  }

  /**
   * Получить случайного пользователя из списка
   * @param {Array} users - список пользователей
   * @returns {Object}
   */
  getRandomUser(users) {
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
  }
}