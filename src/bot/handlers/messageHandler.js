// Обработчик сообщений
import messageService from '../../services/messageService.js';
import messages from '../../locales/index.js';

export const handleMessage = async (ctx) => {
  try {
    // Проверяем, что сообщение текстовое
    if (ctx.message.text) {
      // Проверяем, есть ли у пользователя непрочитанные сообщения
      // Если да - считаем новое сообщение ответом на последнее непрочитанное
      const unrepliedMessages = await messageService.getUnrepliedMessages(ctx.from.id);
      
      if (unrepliedMessages && unrepliedMessages.length > 0) {
        // Отвечаем на последнее непрочитанное сообщение
        await messageService.replyToLastMessage(ctx);
      } else {
        // Если у пользователя нет непрочитанных сообщений, 
        // то отправляем сообщение только если пользователь зарегистрирован
        const user = await messageService.getUser(ctx.from.id);
        if (!user) {
          await ctx.reply(messages.ru.USER_NOT_REGISTERED);
          return;
        }
        
        // Пересылаем как новое сообщение
        await messageService.forwardMessage(ctx);
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