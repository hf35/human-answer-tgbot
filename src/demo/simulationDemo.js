// Демонстрация работы сервиса имитации пользователей
import { SimulationService } from '../services/simulationService.js';

async function runDemo() {
  console.log('=== Демонстрация работы сервиса имитации ===\n');
  
  // Создаем сервис симуляции
  const simulationService = new SimulationService();
  
  try {
    // Создаем нескольких пользователей для симуляции
    console.log('1. Создание пользователей...');
    const user1 = simulationService.createUser();
    const user2 = simulationService.createUser();
    
    console.log(`Создан пользователь 1: ${user1.username}`);
    console.log(`Создан пользователь 2: ${user2.username}\n`);
    
    // Регистрируем пользователей
    console.log('2. Регистрация пользователей...');
    await simulationService.registerUser(user1);
    await simulationService.registerUser(user2);
    
    // Имитируем диалоги
    console.log('\n3. Имитация диалогов...');
    
    // Пользователь 1 отправляет вопрос
    const question1 = 'Привет! Как дела?';
    console.log(`Пользователь ${user1.username} спрашивает: "${question1}"`);
    await simulationService.sendMessage(user1, question1);
    
    // Имитируем ответ от ИИ
    const aiResponse1 = 'Привет! У меня всё хорошо, спасибо за интерес! Как у вас дела?';
    console.log(`ИИ отвечает: "${aiResponse1}"`);
    
    // Пользователь 2 отправляет вопрос
    const question2 = 'Можно ли получить помощь с задачей?';
    console.log(`Пользователь ${user2.username} спрашивает: "${question2}"`);
    await simulationService.sendMessage(user2, question2);
    
    // Имитируем ответ от ИИ
    const aiResponse2 = 'Конечно, я постараюсь помочь. Расскажите подробнее о вашей задаче.';
    console.log(`ИИ отвечает: "${aiResponse2}"`);
    
    // Пользователь 1 отвечает на вопрос пользователя 2
    const reply = 'Спасибо за помощь! Это очень полезно.';
    console.log(`Пользователь ${user1.username} отвечает: "${reply}"`);
    await simulationService.sendMessage(user1, reply);
    
    // Получаем диалоги пользователей
    console.log('\n4. Получение диалогов...');
    const dialogs1 = await simulationService.getUserDialogs(user1.id);
    const dialogs2 = await simulationService.getUserDialogs(user2.id);
    
    console.log(`Диалоги пользователя ${user1.username}:`);
    dialogs1.forEach(dialog => {
      console.log(`  - ${dialog.message_text} (${new Date(dialog.forwarded_at).toLocaleString('ru-RU')})`);
    });
    
    console.log(`Диалоги пользователя ${user2.username}:`);
    dialogs2.forEach(dialog => {
      console.log(`  - ${dialog.message_text} (${new Date(dialog.forwarded_at).toLocaleString('ru-RU')})`);
    });
    
    console.log('\n=== Демонстрация завершена ===');
    
  } catch (error) {
    console.error('Ошибка в демонстрации:', error);
  }
}

// Запускаем демо, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo };