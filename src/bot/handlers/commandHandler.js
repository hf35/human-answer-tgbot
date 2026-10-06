// Обработчик команд
import messages from '../../locales/index.js';

const start = async (ctx) => {
  await ctx.reply(messages.ru.COMMAND_START);
};

const help = async (ctx) => {
  await ctx.reply(messages.ru.COMMAND_HELP);
};

export default {
  start,
  help
};