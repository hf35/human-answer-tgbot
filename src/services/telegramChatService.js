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

      // Пользователи, которые ещё не ответили на полученное сообщение,
      // исключаются из пула получателей: не отправляем им новые сообщения,
      // пока они не разберутся с текущими
      const busyUserIds = await this.getBusyUserIds();

      const availableUsers = users.filter(user =>
        Number(user.telegram_id) !== Number(sender.id) &&
        !busyUserIds.includes(Number(user.telegram_id))
      );

      if (availableUsers.length === 0) {
        throw new Error(
          busyUserIds.length > 0
            ? 'Нет доступных пользователей: все остальные ещё не ответили на полученные сообщения'
            : 'Нет доступных пользователей для пересылки'
        );
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
   * Отправить сообщение от имени пользователя конкретному получателю
   * @param {Object} sender - отправитель
   * @param {number} receiverId - ID получателя
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>}
   */
  async sendMessageToUser(sender, receiverId, messageText, replyMessageId = null) {
    try {
      // Проверяем, что отправитель зарегистрирован
      const senderUser = await this.getUser(sender.id);
      if (!senderUser) {
        throw new Error('Пользователь не зарегистрирован');
      }

      // Проверяем, что получатель зарегистрирован
      const receiverUser = await this.getUser(receiverId);
      if (!receiverUser) {
        throw new Error('Получатель не зарегистрирован');
      }

      // Нельзя отправить сообщение самому себе
      if (Number(sender.id) === Number(receiverId)) {
        throw new Error('Нельзя отправить сообщение самому себе');
      }

      // Пользователю, который ещё не ответил на полученное сообщение,
      // новые сообщения не отправляем. Это правило НЕ применяется,
      // когда сообщение является ответом — иначе ответить ему
      // было бы невозможно.
      if (replyMessageId === null) {
        const receiverUnreplied = await this.getUnrepliedMessages(receiverId);
        if (receiverUnreplied && receiverUnreplied.length > 0) {
          throw new Error(
            `${receiverUser.first_name || 'Пользователь'} ещё не ответил на полученное сообщение — новые сообщения ему не отправляются`
          );
        }
      }

      // Сохраняем сообщение в базе. Если это ответ на конкретное сообщение,
      // связываем их через reply_message_id и помечаем исходное отвеченным
      const db = getDB();
      const result = await db.run(
        `INSERT INTO messages (sender_id, receiver_id, message_text, reply_message_id)
         VALUES (?, ?, ?, ?)`,
        [sender.id, receiverId, messageText, replyMessageId]
      );

      if (replyMessageId) {
        await db.run('UPDATE messages SET replied = TRUE WHERE id = ?', [replyMessageId]);
      }

      return {
        id: result.lastID,
        sender_id: Number(sender.id),
        receiver_id: Number(receiverId),
        message_text: messageText
      };
    } catch (error) {
      console.error('Ошибка при отправке сообщения пользователю:', error);
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
      
      // Сохраняем ответ как отдельное сообщение, связанное с исходным
      // через reply_message_id, и отмечаем исходное сообщение отвеченным
      await db.run(
        `INSERT INTO messages (sender_id, receiver_id, message_text, reply_message_id)
         VALUES (?, ?, ?, ?)`,
        [user.id, lastUnrepliedMessage.sender_id, replyText, lastUnrepliedMessage.id]
      );

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
   * Получить ID пользователей, у которых есть непрочитанные входящие сообщения.
   * Таким пользователям не отправляют новые сообщения, пока они не ответят.
   * @returns {Promise<Array<number>>}
   */
  async getBusyUserIds() {
    try {
      const db = getDB();
      const rows = await db.all(
        'SELECT DISTINCT receiver_id FROM messages WHERE replied = FALSE'
      );
      return rows.map(row => Number(row.receiver_id));
    } catch (error) {
      console.error('Ошибка при получении занятых пользователей:', error);
      throw error;
    }
  }

  /**
   * Получить сообщения пользователя, на которые ещё не получен ответ.
   * Пользователь не может отправить новое сообщение, пока есть такое.
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>}
   */
  async getAwaitingReplyMessages(userId) {
    try {
      const db = getDB();
      const messages = await db.all(
        `SELECT m.*, u.first_name as receiver_first_name, u.last_name as receiver_last_name
         FROM messages m
         LEFT JOIN users u ON m.receiver_id = u.telegram_id
         WHERE m.sender_id = ? AND m.replied = FALSE
         ORDER BY m.forwarded_at ASC`,
        [userId]
      );
      return messages;
    } catch (error) {
      console.error('Ошибка при получении сообщений, ожидающих ответа:', error);
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