// Обработчик сообщений
import { MessageBusinessService } from '../../services/messageBusinessService.js';
import { TelegramChatService } from '../../services/telegramChatService.js';
import messages from '../../locales/index.js';

// Создаем экземпляр сервиса чатов для Telegram
const telegramChatService = new TelegramChatService();
// Создаем бизнес-сервис с использованием Telegram-чата
const messageBusinessService = new MessageBusinessService(telegramChatService);

export const handleMessage = async (ctx) => {
  try {
    // Проверяем, что сообщение текстовое
    if (ctx.message.text) {
      // Получаем информацию о пользователе из контекста Telegram
      const sender = {
        id: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name
      };
      
      // Обрабатываем сообщение через бизнес-логику
      const result = await messageBusinessService.handleMessage(sender, ctx.message.text);
      
      if (result.type === 'error') {
        await ctx.reply(result.message);
      } else if (result.type === 'forward') {
        await ctx.reply(messages.ru.MESSAGE_FORWARDED.replace('%s', 'пользователю'));
      } else if (result.type === 'reply') {
        await ctx.reply(messages.ru.REPLY_SUCCESS);
      }
    } else {
      // Для других типов сообщений можно добавить обработку
      await ctx.reply(messages.ru.INVALID_MESSAGE_TYPE);
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply(messages.ru.ERROR_MESSAGE_PROCESSING);
  }
};