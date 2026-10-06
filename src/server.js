// Запуск веб-сервера для API и веб-интерфейса
import { app, initializeDatabase } from './backend/main.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Инициализация базы данных
    await initializeDatabase();
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Веб-сервер запущен на порту ${PORT}`);
      console.log(`Веб-интерфейс доступен по адресу: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();