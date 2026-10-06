// Скрипт для сброса базы данных и перезапуска сервера
import fs from 'fs';
import { exec } from 'child_process';

// Удаляем файл базы данных
try {
  fs.unlinkSync('./database.sqlite');
  console.log('Файл базы данных удален');
} catch (error) {
  console.log('Файл базы данных не найден или уже удален');
}

// Перезапускаем сервер
exec('npm run server', (error, stdout, stderr) => {
  if (error) {
    console.error(`Ошибка при запуске сервера: ${error}`);
    return;
  }
  console.log(`Сервер перезапущен:\n${stdout}`);
  if (stderr) {
    console.error(`Ошибки сервера: ${stderr}`);
  }
});