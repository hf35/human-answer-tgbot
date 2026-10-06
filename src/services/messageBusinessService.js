// Бизнес-логика обработки сообщений (независимая от Telegram)
import { getDB } from '../database/db.js';
import messages from '../locales/index.js';

export class MessageBusinessService {
  constructor(chatService) {
    this.chatService = chatService;
  }

  /**
   * Обработать входящее сообщение
   * @param {Object} sender - отправитель сообщения
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>}
   */
  async handleMessage(sender, messageText) {
    try {
      // Проверяем, есть ли у пользователя непрочитанные сообщения
      const unrepliedMessages = await this.chatService.getUnrepliedMessages(sender.id);
      
      if (unrepliedMessages && unrepliedMessages.length > 0) {
        // Отвечаем на последнее непрочитанное сообщение
        await this.replyToLastMessage(sender, messageText);
        return { type: 'reply', message: 'Ответ отправлен на последнее непрочитанное сообщение' };
      } else {
        // Если у пользователя нет непрочитанных сообщений, 
        // то отправляем сообщение только если пользователь зарегистрирован
        const user = await this.chatService.getUser(sender.id);
        if (!user) {
          return { type: 'error', message: messages.ru.USER_NOT_REGISTERED };
        }
        
        // Пересылаем как новое сообщение
        const result = await this.forwardMessage(sender, messageText);
        return { type: 'forward', message: 'Сообщение переслано', data: result };
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
      throw new Error(messages.ru.ERROR_MESSAGE_PROCESSING);
    }
  }

  /**
   * Переслать сообщение
   * @param {Object} sender - отправитель
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>}
   */
  async forwardMessage(sender, messageText) {
    try {
      // Проверяем, зарегистрирован ли пользователь
      const user = await this.chatService.getUser(sender.id);
      
      if (!user) {
        throw new Error(messages.ru.USER_NOT_REGISTERED);
      }
      
      // Пересылаем сообщение через chatService
      const result = await this.chatService.forwardMessage(sender, messageText);
      
      return result;
    } catch (error) {
      console.error('Ошибка при пересылке сообщения:', error);
      throw error;
    }
  }

  /**
   * Ответить на последнее непрочитанное сообщение
   * @param {Object} user - пользователь, который отвечает
   * @param {string} replyText - текст ответа
   * @returns {Promise<void>}
   */
  async replyToLastMessage(user, replyText) {
    try {
      // Отправляем ответ через chatService
      await this.chatService.replyToLastMessage(user, replyText);
      
    } catch (error) {
      console.error('Ошибка при ответе на сообщение:', error);
      throw new Error(messages.ru.ERROR_REPLY);
    }
  }

  /**
   * Получить все диалоги пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>}
   */
  async getUserDialogs(userId) {
    try {
      const db = getDB();
      const dialogs = await db.all(`
        SELECT 
          m.id,
          m.sender_id,
          m.receiver_id,
          m.message_text,
          m.replied,
          m.forwarded_at,
          u.first_name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.telegram_id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.forwarded_at DESC
      `, [userId, userId]);
      
      return dialogs;
    } catch (error) {
      console.error('Ошибка при получении диалогов пользователя:', error);
      throw error;
    }
  }

  /**
   * Получить историю конкретного диалога
   * @param {number} senderId - ID отправителя
   * @param {number} receiverId - ID получателя
   * @returns {Promise<Array>}
   */
  async getDialogHistory(senderId, receiverId) {
    try {
      const db = getDB();
      const history = await db.all(`
        SELECT 
          m.id,
          m.sender_id,
          m.receiver_id,
          m.message_text,
          m.replied,
          m.forwarded_at,
          u.first_name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.telegram_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.forwarded_at ASC
      `, [senderId, receiverId, receiverId, senderId]);
      
      return history;
    } catch (error) {
      console.error('Ошибка при получении истории диалога:', error);
      throw error;
    }
  }

  /**
   * Получить все диалоги из базы данных
   * @returns {Promise<Array>}
   */
  async getAllDialogs() {
    try {
      const db = getDB();
      const dialogs = await db.all(`
        SELECT 
          m.id,
          m.sender_id,
          m.receiver_id,
          m.message_text,
          m.replied,
          m.forwarded_at,
          sender.first_name as sender_name,
          receiver.first_name as receiver_name
        FROM messages m
        LEFT JOIN users sender ON m.sender_id = sender.telegram_id
        LEFT JOIN users receiver ON m.receiver_id = receiver.telegram_id
        ORDER BY m.forwarded_at DESC
      `);
      
      return dialogs;
    } catch (error) {
      console.error('Ошибка при получении всех диалогов:', error);
      throw error;
    }
  }
}