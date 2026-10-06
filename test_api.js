// Простой скрипт для тестирования API отправки сообщений
const fetch = require('node-fetch');

async function testSendMessage() {
  try {
    console.log('Тест отправки сообщения через API...');
    
    const response = await fetch('http://localhost:3001/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 12345,
        messageText: 'Тестовое сообщение для проверки API'
      })
    });
    
    const data = await response.json();
    console.log('Ответ от сервера:', data);
    
  } catch (error) {
    console.error('Ошибка при тестировании API:', error);
  }
}

// Запускаем тест
testSendMessage();