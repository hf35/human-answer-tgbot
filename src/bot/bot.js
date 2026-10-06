// Инициализация бота и настройка обработчиков
import { Telegraf } from 'telegraf';
import messageHandler from './handlers/messageHandler.js';
import commandHandler from './handlers/commandHandler.js';

const init = (bot) => {
  // Обработка команд
  bot.command('start', commandHandler.start);
  bot.command('help', commandHandler.help);
  
  // Обработка текстовых сообщений
  bot.on('message', messageHandler.handleMessage);
  
  // Запуск бота
  bot.launch();
  
  console.log('Бот инициализирован и готов к работе');
};

export default {
  init
};