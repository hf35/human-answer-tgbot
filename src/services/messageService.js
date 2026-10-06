// Сервис логики пересылки сообщений
import { getDB } from '../database/db.js';
import { getUser, createUser, getAllUsers } from './userService.js';
import { getRandomUser } from './randomService.js';
import messages from '../../locales/index.js';

export const forwardMessage = async (ctx) => {
  try {
    const senderId = ctx.from.id;
    const messageText = ctx.message.text;
    
    // Получаем информацию о пользователе
    let user = await getUser(senderId);
    
    // Если пользователь не зарегистрирован, возвращаем ошибку
    if (!user) {
      await ctx.reply(messages.ru.USER_NOT_REGISTERED);
      return;
    }
    
    // Получаем список пользователей (кроме отправителя)
    const users = await getAllUsers();
    const availableUsers = users.filter(user => user.telegram_id !== senderId);
    
    if (availableUsers.length === 0) {
      await ctx.reply(messages.ru.NO_USERS_AVAILABLE);
      return;
    }
    
    // Выбираем случайного получателя
    const receiver = getRandomUser(availableUsers);
    
    // Сохраняем информацию о пересылке
    const db = getDB();
    const result = await db.run(
      'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
      [senderId, receiver.telegram_id, messageText]
    );
    
    // Пересылаем сообщение получателю
    await ctx.telegram.sendMessage(
      receiver.telegram_id, 
      messages.ru.NEW_MESSAGE_NOTIFICATION.replace('%s', ctx.from.first_name || ctx.from.username || senderId).replace('%s', messageText)
    );
    
    await ctx.reply(messages.ru.MESSAGE_FORWARDED.replace('%s', receiver.first_name || receiver.username || receiver.telegram_id));
    
    return result;
  } catch (error) {
    console.error('Ошибка при пересылке сообщения:', error);
    throw error;
  }
};

export const replyToLastMessage = async (ctx) => {
  try {
    const replyText = ctx.message.text;
    const userId = ctx.from.id;
    
    // Получаем информацию о пользователе
    let user = await getUser(userId);
    
    // Если пользователь не зарегистрирован, возвращаем ошибку
    if (!user) {
      await ctx.reply(messages.ru.USER_NOT_REGISTERED);
      return;
    }
    
    // Получаем последнее непрочитанное сообщение для пользователя
    const db = getDB();
    const lastUnrepliedMessage = await db.get(
      'SELECT * FROM messages WHERE receiver_id = ? AND replied = FALSE ORDER BY forwarded_at DESC LIMIT 1',
      [userId]
    );
    
    if (!lastUnrepliedMessage) {
      // Если нет непрочитанных сообщений, отправляем как новое сообщение
      await forwardMessage(ctx);
      return;
    }
    
    // Отправляем ответ отправителю
    await ctx.telegram.sendMessage(
      lastUnrepliedMessage.sender_id,
      messages.ru.REPLY_TO_MESSAGE.replace('%s', replyText)
    );
    
    // Обновляем сообщение как отвеченный
    await db.run(
      'UPDATE messages SET replied = TRUE WHERE id = ?', 
      [lastUnrepliedMessage.id]
    );
    
    await ctx.reply(messages.ru.REPLY_SUCCESS);
    
  } catch (error) {
    console.error('Ошибка при ответе на сообщение:', error);
    await ctx.reply(messages.ru.ERROR_REPLY);
  }
};

export const getUnrepliedMessages = async (userId) => {
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
};

export const getUser = async (telegramId) => {
  try {
    const user = await getUser(telegramId);
    return user;
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    throw error;
  }
};