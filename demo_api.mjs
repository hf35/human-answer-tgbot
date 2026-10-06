// Демонстрация работы с API бэкенда
import fetch from 'node-fetch';

async function demo() {
  console.log('=== Демонстрация работы с API ===\n');
  
  // Регистрация пользователя
  console.log('1. Регистрация пользователя...');
  const registerResponse = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 12345,
      username: 'test_user',
      firstName: 'Тест',
      lastName: 'Пользователь'
    })
  });
  
  const registerResult = await registerResponse.json();
  console.log('Результат регистрации:', registerResult);
  
  // Регистрация второго пользователя
  console.log('\n2. Регистрация второго пользователя...');
  const registerResponse2 = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 67890,
      username: 'second_user',
      firstName: 'Второй',
      lastName: 'Пользователь'
    })
  });
  
  const registerResult2 = await registerResponse2.json();
  console.log('Результат регистрации второго пользователя:', registerResult2);
  
  // Получение списка пользователей
  console.log('\n3. Получение списка пользователей...');
  const usersResponse = await fetch('http://localhost:3000/api/users');
  const usersResult = await usersResponse.json();
  console.log('Список пользователей:', usersResult.data);
  
  // Отправка сообщения
  console.log('\n4. Отправка сообщения...');
  const messageResponse = await fetch('http://localhost:3000/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 12345,
      messageText: 'Привет, это тестовое сообщение!'
    })
  });
  
  const messageResult = await messageResponse.json();
  console.log('Результат отправки сообщения:', messageResult);
  
  // Получение всех диалогов
  console.log('\n5. Получение всех диалогов...');
  const dialogsResponse = await fetch('http://localhost:3000/api/dialogs');
  const dialogsResult = await dialogsResponse.json();
  console.log('Все диалоги:', dialogsResult.data);
  
  console.log('\n=== Демонстрация завершена ===');
}

demo().catch(console.error);