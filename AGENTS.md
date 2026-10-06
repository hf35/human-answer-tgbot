# Development Guidelines

## Code Style and Format

### ES6 Module Format
All JavaScript files must use ES6 module format with `import`/`export` syntax instead of CommonJS `require`/`module.exports`.

Example:
```javascript
// Correct - ES6 import
import { Telegraf } from 'telegraf';
import bot from './bot/bot.js';

// Incorrect - CommonJS
const { Telegraf } = require('telegraf');
const bot = require('./bot/bot');
```

### Language Guidelines

#### Code Comments
All code comments must be written in **English**.

#### User-facing Messages
All user-facing messages (replies, notifications, etc.) must be written in **Russian**.

Example:
```javascript
// Comment in English
const handleMessage = async (ctx) => {
  // This is a comment in English
  await ctx.reply('Добро пожаловать в бот для пересылки сообщений!'); // Message in Russian
};
```

## File Structure
- All source code goes in `src/` directory
- Main entry point is `src/index.js`
- Backend API in `src/backend/`
- Bot logic in `src/bot/`
- Database logic in `src/database/`
- Services in `src/services/`
- Handlers in `src/bot/handlers/`
- Web UI in `src/webui/`
- API endpoints in `src/api/`

## Dependencies
- Use ES6 modules for all imports
- All dependencies are defined in package.json

## Architecture Overview

The project follows a backend-first architecture where:

1. **Main Backend Service** (`src/backend/main.js`) - Provides core functionality through REST API and web interface
2. **Telegram Bot Interface** (`src/bot/`) - Optional interface to the main backend service
3. **Web UI** (`src/webui/`) - Web-based interface for viewing all dialogs without needing IDs
4. **API Layer** (`src/api/`) - Exposes backend functionality through REST endpoints

This architecture allows:
- Testing and development through web interface
- Simulating multiple users via web interface
- Separation of concerns between Telegram interface and core logic
- Easy integration with other systems through API