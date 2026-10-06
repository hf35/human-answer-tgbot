// Сервис для имитации работы пользователей
import { MessageBusinessService } from './messageBusinessService.js';
import { TelegramChatService } from './telegramChatService.js';
import { getDB } from '../database/db.js';

export class SimulationService {
  constructor() {
    // Создаем экземпляр сервиса чатов для симуляции
    const telegramChatService = new TelegramChatService();
    // Создаем бизнес-сервис с использованием Telegram-чата
    this.messageBusinessService = new MessageBusinessService(telegramChatService);
    
    // Список пользователей для симуляции
    this.users = [];
    this.currentUserId = 1000; // Начальный ID для новых пользователей
  }

  /**
   * Создать нового пользователя для симуляции
   * @returns {Object} Созданный пользователь
   */
  createUser() {
    const user = {
      id: this.currentUserId++,
      username: `sim_user_${this.currentUserId}`,
      firstName: `Симулятор ${this.currentUserId}`,
      lastName: ''
    };
    
    this.users.push(user);
    return user;
  }

  /**
   * Зарегистрировать пользователя в системе
   * @param {Object} user - пользователь для регистрации
   * @returns {Promise<void>}
   */
  async registerUser(user) {
    try {
      // Регистрируем пользователя через чат-сервис
      const telegramChatService = new TelegramChatService();
      await telegramChatService.createUser({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      console.log(`Пользователь ${user.username} зарегистрирован`);
    } catch (error) {
      console.error('Ошибка при регистрации пользователя:', error);
      throw error;
    }
  }

  /**
   * Отправить сообщение от пользователя
   * @param {Object} user - отправитель
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>} Результат отправки
   */
  async sendMessage(user, messageText) {
    try {
      console.log(`Пользователь ${user.username} отправляет сообщение: "${messageText}"`);
      
      // Обрабатываем сообщение через бизнес-логику
      const result = await this.messageBusinessService.handleMessage(user, messageText);
      
      console.log(`Сообщение обработано. Результат:`, result);
      return result;
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      throw error;
    }
  }

  /**
   * Получить список пользователей
   * @returns {Array} Список пользователей
   */
  getUsers() {
    return this.users;
  }

  /**
   * Получить диалоги пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} Диалоги пользователя
   */
  async getUserDialogs(userId) {
    try {
      const dialogs = await this.messageBusinessService.getUserDialogs(userId);
      return dialogs;
    } catch (error) {
      console.error('Ошибка при получении диалогов:', error);
      throw error;
    }
  }

  /**
   * Имитировать простой вопрос-ответ
   * @param {Object} user - пользователь
   * @param {string} question - вопрос пользователя
   * @returns {Promise<Object>} Результат обработки
   */
  async simulateQuestionAnswer(user, question) {
    // Отправляем вопрос
    const result = await this.sendMessage(user, question);
    
    // Имитируем ответ от ИИ (в реальной реализации здесь будет вызов ИИ)
    const aiResponse = this.generateAIResponse(question);
    
    // Отправляем ответ
    await this.sendMessage(user, aiResponse);
    
    return {
      question,
      answer: aiResponse,
      result
    };
  }

  /**
   * Генерация имитированного ответа от ИИ
   * @param {string} question - вопрос пользователя
   * @returns {string} Ответ
   */
  generateAIResponse(question) {
    // Простая логика для имитации ответов
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('привет') || lowerQuestion.includes('здравствуй')) {
      return 'Привет! Как я могу вам помочь?';
    } else if (lowerQuestion.includes('как дела')) {
      return 'У меня всё хорошо, спасибо за интерес! Как у вас дела?';
    } else if (lowerQuestion.includes('помоги')) {
      return 'Конечно, я постараюсь помочь. Расскажите подробнее о вашей проблеме.';
    } else if (lowerQuestion.includes('спасибо')) {
      return 'Пожалуйста! Рад был помочь.';
    } else {
      // Для других вопросов возвращаем стандартный ответ
      return 'Спасибо за ваш вопрос. Я получил его и обязательно отвечу.';
    }
  }
}