// Схема базы данных
const initSchema = async (db) => {
  try {
    // Создание таблицы пользователей
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы пересылок
    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message_text TEXT NOT NULL,
        forwarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        replied BOOLEAN DEFAULT FALSE,
        reply_message_id INTEGER,
        FOREIGN KEY (sender_id) REFERENCES users (telegram_id),
        FOREIGN KEY (receiver_id) REFERENCES users (telegram_id)
      )
    `);

    console.log('Схема базы данных создана');
  } catch (error) {
    console.error('Ошибка при создании схемы базы данных:', error);
    throw error;
  }
};

export { initSchema };