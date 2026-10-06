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

## API Endpoints

The following API endpoints are available:

### Message Handling
- `POST /api/message` - Send a message on behalf of a user.
  Body: `{ userId, messageText, receiverId? }`. With `receiverId` the message
  goes to that user; without it the bot logic (reply / random) applies.
- `GET /api/dialogs` - Get all dialogs
- `GET /api/dialog/:senderId/:receiverId` - Get dialog history between two users

### User Management
- `GET /api/users` - Get list of all users with message counters
  (`sent_count`, `received_count`, `unread_count`, `awaiting_reply_count`)
- `GET /api/user-messages/:userId` - Get all messages for a specific user (both sent and received)
- `POST /api/register` - Register a user.
  Body: `{ userId, username?, firstName?, lastName? }`

## Core Messaging Rules

The behavior of the bot is defined by the rule **"one message — one reply"**.
When changing message handling, preserve these rules — they are interdependent,
and violating any of them produces deadlocked dialogs.

### Terms

- **Unread message** — a message with `replied = FALSE` (the receiver has not answered).
- **Awaiting reply** — the user has an outgoing message with `replied = FALSE`.
- **Busy user** — the user has an unread *incoming* message.

Note that "awaiting reply" and "busy" are **different states**: a user can be
awaiting a reply to their own message while also being busy with someone else's.

### Rules that must be enforced

1. **Replies are always allowed.** If a user has an unread incoming message,
   their message is treated as a *reply* to the last unread one
   (`handleMessage`). Never block this. If replies were blocked, a user who is
   awaiting a reply could not answer an incoming message, and neither side of
   the dialog could proceed.

2. **One message — one reply.** While a user is awaiting a reply, they cannot
   send a new message — neither to a random recipient nor to a manually chosen
   one. See `AWAITING_REPLY` in `src/locales/ru.js`.

3. **Busy users receive nothing.** Users with unread incoming messages are
   excluded from the random recipient pool (`getBusyUserIds`) and rejected for
   manual sends. **This rule must not apply to replies** — otherwise a busy
   user could never become free again.

4. **Replies are persisted as separate rows.** A reply is inserted into
   `messages` with `reply_message_id` pointing at the original, and the
   original is set to `replied = TRUE`. Never "answer" by only flipping the
   `replied` flag — the reply text would be lost and the conversation would be
   invisible in the web UI.

### Validation order

`handleMessage` (random routing) — order matters:
1. Unread incoming exists → reply.
2. Awaiting reply → reject (rule 2).
3. Otherwise → forward to a random free recipient (rule 3).

`sendMessageToUser` (manual recipient) — order matters:
1. Sender awaiting reply → reject (rule 2).
2. Unread incoming exists: from the chosen recipient → treat as reply and mark
   the original replied; from someone else → reject.
3. Chosen recipient is busy → reject (rule 3).
4. Otherwise → send.

Keep the "is this a reply?" check (`replyMessageId !== null`) *before* the busy
recipient check, otherwise rule 3 would block the very reply that rule 1 requires.

### API response contract

All endpoints return `{ success, data?, error? }`. Business-rule violations are
**not** `200 OK` — `handleMessage` returns `{ type: 'error' }` without throwing,
so `src/api/webApi.js` converts it to **HTTP 409**. A rule violation must never
be reported as `success: true`.

### Web UI conventions (`src/webui/users.html`)

- The page is a **simulation tool** for checking bot behavior, not a real
  messenger. Random recipient routing is the default and must stay the default;
  manual selection is an additional option for testing a specific dialog.
- Show which branch will run *before* sending (the hint line under the composer).
- **All** user-provided values inserted via `innerHTML` must go through
  `escapeHtml()` — message text and usernames are untrusted input.
- Database timestamps are SQLite `YYYY-MM-DD HH:MM:SS` in UTC; parse by
  replacing the space with `T` and appending `Z`, otherwise times render as
  invalid dates.
- `loadUsers(silent)` must not clobber a status message set by the caller.

## Testing and Development

The system can be tested through:
1. Telegram interface (default)
2. Web UI for viewing dialogs without needing IDs
3. API endpoints for programmatic access
4. Simulated users via web interface or API

### Test isolation

Tests hit a live server and share one SQLite file, so state leaks between runs.
Always use **unique user IDs per run** (e.g. `Date.now() % 1000000`) and reset
the database before each suite. Assertions must account for accumulated users
rather than assuming a fixed count.

Tests that verify random routing must give the sender a **clean state**
(no unread, nothing pending); otherwise the send becomes a reply and never
reaches the random pool. To obtain many random samples, use many fresh senders
that each send exactly once.

Test fixtures must respect the rules above: to make a user *busy*, another user
must write to them. That writer then becomes "awaiting" and cannot send anything
else — use a dedicated setup user so it does not occupy a slot in the pool.
