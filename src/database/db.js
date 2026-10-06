// Абстракция базы данных для легкого перехода между SQLite и PostgreSQL
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Инициализация базы данных
let db;

const init = async () => {
  try {
    // Для начальной реализации используем SQLite
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
    
    console.log('База данных инициализирована');
    return db;
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
};

// Получение экземпляра базы данных
const getDB = () => {
  if (!db) {
    throw new Error('База данных не инициализирована. Сначала вызовите init().');
  }
  return db;
};

export { init, getDB };