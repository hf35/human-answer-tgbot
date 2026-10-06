// Сервис логики пересылки сообщений
import { getDB } from '../database/db.js';
import { getUser, createUser, getAllUsers } from './userService.js';
import { getRandomUser } from './randomService.js';
import messages from '../../locales/index.js';

const forwardMessage = async (ctx) => {
  try {
    const senderId = ctx.from.id;
    const messageText = ctx.message.text;
    
    // Регистрируем отправителя
    await createUser({
      telegramId: senderId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    });
    
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

export { forwardMessage };