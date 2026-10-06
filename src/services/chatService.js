// Абстрактный интерфейс для сервиса чатов
export class IChatService {
  /**
   * Отправить сообщение пользователю
   * @param {Object} recipient - информация о получателе
   * @param {string} messageText - текст сообщения
   * @returns {Promise<void>}
   */
  async sendMessage(recipient, messageText) {
    throw new Error('Метод sendMessage должен быть реализован');
  }

  /**
   * Получить пользователя по ID
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object|null>}
   */
  async getUser(userId) {
    throw new Error('Метод getUser должен быть реализован');
  }

  /**
   * Создать нового пользователя
   * @param {Object} userData - данные пользователя
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    throw new Error('Метод createUser должен быть реализован');
  }

  /**
   * Получить всех пользователей
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    throw new Error('Метод getAllUsers должен быть реализован');
  }

  /**
   * Переслать сообщение
   * @param {Object} sender - отправитель
   * @param {string} messageText - текст сообщения
   * @returns {Promise<Object>}
   */
  async forwardMessage(sender, messageText) {
    throw new Error('Метод forwardMessage должен быть реализован');
  }

  /**
   * Ответить на сообщение
   * @param {Object} user - пользователь, который отвечает
   * @param {string} replyText - текст ответа
   * @returns {Promise<void>}
   */
  async replyToLastMessage(user, replyText) {
    throw new Error('Метод replyToLastMessage должен быть реализован');
  }

  /**
   * Получить непрочитанные сообщения
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>}
   */
  async getUnrepliedMessages(userId) {
    throw new Error('Метод getUnrepliedMessages должен быть реализован');
  }
}