// Сервис случайного выбора получателя
export const getRandomUser = (users) => {
  if (!users || users.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
};