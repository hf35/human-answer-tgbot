// Демонстрация симуляции пользователей через API
import fetch from 'node-fetch';

// Массивы для генерации уникальных сообщений
const greetings = [
  "Привет!",
  "Здравствуйте!",
  "Добрый день!",
  "Доброе утро!",
  "Добрый вечер!"
];

const questions = [
  "Как дела?",
  "Что нового?",
  "Как прошёл день?",
  "Что ты думаешь об этом?",
  "Можешь помочь мне с этим?",
  "Какой у тебя любимый фильм?",
  "Что ты ел сегодня?",
  "Какой сегодня день недели?",
  "Ты любишь кофе?",
  "Какой у тебя любимый цвет?"
];

const responses = [
  "Отлично, спасибо!",
  "Всё хорошо, спасибо!",
  "Нормально, спасибо!",
  "Отлично, живу!",
  "Всё отлично!",
  "Прекрасно!",
  "Плохо не могу, но и хорошо не скажу",
  "Так себе",
  "Спасибо за интересный вопрос!",
  "Это интересно!"
];

const topics = [
  "работа",
  "образование",
  "путешествия",
  "кино",
  "музыка",
  "спорт",
  "еда",
  "погода",
  "технологии",
  "путешествия"
];

const randomMessages = [
  "Это интересный вопрос!",
  "Я тоже думаю так же.",
  "Мне нравится этот подход.",
  "Это действительно важно.",
  "Спасибо за информацию!",
  "Понимаю, что ты имеешь в виду.",
  "Интересно, а как это работает?",
  "У меня есть другой взгляд на эту тему.",
  "Мне интересно узнать больше об этом.",
  "Это действительно полезная информация."
];

// Функция для генерации случайного задержки (1-5 секунд)
function randomDelay() {
  return Math.floor(Math.random() * 4000) + 1000; // от 1 до 5 секунд
}

// Функция для ожидания
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Генерация уникальных сообщений для каждого пользователя
function generateUniqueMessages(userId, index) {
  const userMessages = [];
  
  // Основные темы для каждого пользователя
  const userTopic = topics[index % topics.length];
  
  // Создаем уникальный набор сообщений для каждого пользователя
  for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
    const message = {
      userId: userId,
      messageText: `${greetings[Math.floor(Math.random() * greetings.length)]} ` +
                  `${questions[Math.floor(Math.random() * questions.length)]} ` +
                  `(${userTopic}) ` +
                  `${responses[Math.floor(Math.random() * responses.length)]} ` +
                  `${randomMessages[Math.floor(Math.random() * randomMessages.length)]}`
    };
    
    userMessages.push(message);
  }
  
  return userMessages;
}

async function simulationDemo() {
  console.log('=== Демонстрация симуляции пользователей ===\n');
  
  const users = [];
  const allMessages = [];
  
  // Регистрация 10 пользователей
  console.log('1. Регистрация 10 пользователей...');
  for (let i = 0; i < 10; i++) {
    const userId = 20000 + i;
    const username = `sim_user_${userId}`;
    const firstName = `Симулятор${i+1}`;
    const lastName = `Пользователь${i+1}`;
    
    console.log(`Регистрация пользователя ${i+1} (${username})...`);
    
    const registerResponse = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        username: username,
        firstName: firstName,
        lastName: lastName
      })
    });
    
    const registerResult = await registerResponse.json();
    console.log(`Результат регистрации пользователя ${i+1}:`, registerResult);
    
    users.push({
      id: userId,
      username: username,
      firstName: firstName,
      lastName: lastName
    });
    
    // Добавляем задержку между регистрациями
    await wait(randomDelay());
  }
  
  console.log('\n2. Получение списка пользователей...');
  const usersResponse = await fetch('http://localhost:3000/api/users');
  const usersResult = await usersResponse.json();
  console.log('Список пользователей:', usersResult.data.length, 'пользователей зарегистрировано');
  
  // Генерация уникальных сообщений для каждого пользователя
  console.log('\n3. Генерация уникальных сообщений для каждого пользователя...');
  for (let i = 0; i < users.length; i++) {
    const userMessages = generateUniqueMessages(users[i].id, i);
    allMessages.push(...userMessages);
    console.log(`Пользователь ${i+1} (${users[i].username}): ${userMessages.length} сообщений`);
    
    // Добавляем задержку между пользователями
    await wait(randomDelay());
  }
  
  // Отправка всех сообщений с рандомными задержками
  console.log('\n4. Отправка сообщений...');
  let totalMessages = 0;
  for (const message of allMessages) {
    console.log(`Отправка сообщения от пользователя ${message.userId}: "${message.messageText.substring(0, 50)}..."`);
    
    const messageResponse = await fetch('http://localhost:3000/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const messageResult = await messageResponse.json();
    console.log(`Результат отправки:`, messageResult);
    
    totalMessages++;
    
    // Добавляем случайную задержку между сообщениями
    await wait(randomDelay());
  }
  
  console.log(`\nОтправлено всего ${totalMessages} сообщений`);
  
  // Получение всех диалогов
  console.log('\n5. Получение всех диалогов...');
  const dialogsResponse = await fetch('http://localhost:3000/api/dialogs');
  const dialogsResult = await dialogsResponse.json();
  console.log(`Все диалоги: ${dialogsResult.data.length} диалогов`);
  
  // Показываем несколько первых диалогов
  console.log('\nПримеры диалогов:');
  for (let i = 0; i < Math.min(5, dialogsResult.data.length); i++) {
    const dialog = dialogsResult.data[i];
    console.log(`\nДиалог ${i+1}:`);
    console.log(`  ID: ${dialog.id}`);
    console.log(`  Отправитель: ${dialog.senderId} (${dialog.senderName})`);
    console.log(`  Получатель: ${dialog.recipientId} (${dialog.recipientName})`);
    console.log(`  Сообщение: "${dialog.messageText.substring(0, 100)}..."`);
    console.log(`  Ответ: "${dialog.replyText ? dialog.replyText.substring(0, 100) : 'Нет ответа'}"`);
  }
  
  // Показываем статистику по пользователям
  console.log('\n6. Статистика по пользователям:');
  const userStats = {};
  dialogsResult.data.forEach(dialog => {
    if (!userStats[dialog.senderId]) {
      userStats[dialog.senderId] = { sent: 0, received: 0 };
    }
    if (!userStats[dialog.recipientId]) {
      userStats[dialog.recipientId] = { sent: 0, received: 0 };
    }
    
    userStats[dialog.senderId].sent++;
    userStats[dialog.recipientId].received++;
  });
  
  Object.entries(userStats).forEach(([userId, stats]) => {
    const user = users.find(u => u.id === parseInt(userId));
    const username = user ? user.username : `Пользователь${userId}`;
    console.log(`${username} (ID: ${userId}): отправил ${stats.sent}, получил ${stats.received}`);
  });
  
  console.log('\n=== Симуляция пользователей завершена ===');
}

// Запуск демонстрации
simulationDemo().catch(console.error);