# 🤖 AISecretary

AISecretary is a modern web application that combines a conversational AI assistant with Google Calendar integration. It helps users manage their schedules, create, update, and delete events, and check availability—all through natural language chat.

---

## 🆚 What Makes AISecretary Unique?

Unlike a regular Gemini chat or generic AI assistant, **AISecretary** is purpose-built for productivity and scheduling. Here’s what sets it apart:

- **Actionable Calendar Integration:** AISecretary doesn’t just chat—it connects directly to your Google Calendar, allowing you to create, update, delete, and query events through conversation.
- **Smart Scheduling:** The assistant understands your intent and context, checks for conflicts, and suggests alternative times, making scheduling seamless and intelligent.
- **Personalized Experience:** Authenticates with your Google account, so all actions are performed securely on your real calendar.
- **Workflow Automation:** Handles multi-step flows (like event confirmations and edits) that go beyond simple Q&A or text generation.
- **Protected & Private:** Only you can access your calendar and chat history, unlike public or demo Gemini bots.
- **Modern UI:** Features a responsive, branded interface with protected routes and animated elements for a professional user experience.

In summary, AISecretary transforms Gemini’s conversational power into a practical, secure, and productivity-focused scheduling assistant.

---

## ✨ Features

- **Conversational Chatbot:** Friendly AI assistant that understands natural language.
- **Google Calendar Integration:** Add, update, delete, and query events directly.
- **Smart Conflict Detection:** Prevents overlapping events and suggests alternatives.
- **Authentication:** Secure Google OAuth login.
- **Responsive UI:** Clean, modern React interface with animated branding.
- **Protected Routes:** Only authenticated users can access the chat assistant.

---

## 🖥️ Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Node.js, Express, Google APIs, Gemini AI
- **Authentication:** Google OAuth 2.0, JWT (cookie-based)
- **AI:** Google Gemini for intent extraction and natural language understanding

---

## 🚀 Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/Marksalz/AISecretary.git
cd AISecretary
```

### 2. Setup the Server

```sh
cd server
npm install
# Create a .env file with your Google and JWT credentials
npm run dev
```

### 3. Setup the Client

```sh
cd ../client
npm install
npm run dev
```

### 4. Environment Variables

Create a `.env` file in the `server/` directory with:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
```

---

## 📝 Usage

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Click **Login with Google**.
3. Start chatting with your AI assistant to manage your calendar!

---

## 📁 Project Structure

```
AISecretary/
├── client/                  # React frontend
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── assets/          # Images and icons
│   │   ├── components/      # Reusable React components
│   │   ├── Context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   └── App.tsx, ...     # Main app files
│   ├── Layout-app/          # Layout components and styles
│   ├── index.html           # HTML entry point
│   ├── package.json         # Client dependencies
│   └── ...                  # Other config files
├── server/                  # Express backend & AI logic
│   ├── ai/                  # AI and prompt logic
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── routers/             # Route definitions
│   ├── services/            # Business logic and integrations
│   ├── utils/               # Utility functions
│   ├── package.json         # Server dependencies
│   ├── server.js            # Server entry point
│   └── ...                  # Other backend files
├── README.md                # Project documentation
└── ...                      # Root files
```

---

## 📸 Screenshots

> _Add screenshots of the Welcome page, Chat UI, and event confirmation dialogs here!_

---

## 📄 License

MIT

---

## 🌐 Links

- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [Gemini AI](https://ai.google.dev/)
- [React](https://react.dev/)
