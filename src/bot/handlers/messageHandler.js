// Обработчик сообщений
import messageService from '../../../services/messageService.js';
import messages from '../../../locales/index.js';

const handleMessage = async (ctx) => {
  try {
    // Получаем информацию о пользователе
    const user = ctx.from;
    
    // Проверяем, что сообщение текстовое
    if (ctx.message.text) {
      // Пересылаем сообщение
      await messageService.forwardMessage(ctx);
    } else {
      // Для других типов сообщений можно добавить обработку
      await ctx.reply(messages.ru.INVALID_MESSAGE_TYPE);
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply(messages.ru.ERROR_MESSAGE_PROCESSING);
  }
};

export default {
  handleMessage
};