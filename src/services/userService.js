// Сервис управления пользователями
import { getDB } from '../database/db.js';

const getUser = async (telegramId) => {
  const db = getDB();
  try {
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
    return user;
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    throw error;
  }
};

const createUser = async (userData) => {
  const db = getDB();
  try {
    const result = await db.run(
      'INSERT OR REPLACE INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [userData.telegramId, userData.username, userData.firstName, userData.lastName]
    );
    return result;
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    throw error;
  }
};

const getAllUsers = async () => {
  const db = getDB();
  try {
    const users = await db.all('SELECT * FROM users');
    return users;
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    throw error;
  }
};

export { getUser, createUser, getAllUsers };