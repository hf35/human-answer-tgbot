// Обработчик команд
import messages from '../../locales/index.js';
import { TelegramChatService } from '../../services/telegramChatService.js';

// Создаем экземпляр сервиса чатов для Telegram
const telegramChatService = new TelegramChatService();

export const start = async (ctx) => {
  await ctx.reply(messages.ru.COMMAND_START);
};

export const help = async (ctx) => {
  await ctx.reply(messages.ru.COMMAND_HELP);
};

export const register = async (ctx) => {
  try {
    const userData = {
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    };
    
    // Регистрируем пользователя через чат-сервис
    await telegramChatService.createUser(userData);
    await ctx.reply(messages.ru.COMMAND_REGISTER_SUCCESS);
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    await ctx.reply(messages.ru.ERROR_USER_REGISTRATION);
  }
};