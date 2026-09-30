🤖 AI Noury

AI Noury is a modern and interactive AI assistant web application built with React, Express, and Groq API.

It provides a smooth conversational experience with real-time AI responses, image understanding, voice input, chat history, and a responsive interface with light and dark modes.

🌐 Live Demo

🔗 AI Noury: https://ai-noury.vercel.app

✨ Features
💬 AI-powered conversations
⚡ Real-time streaming responses
🖼️ Image understanding and analysis
🎤 Voice input with speech-to-text
💾 Persistent chat history using LocalStorage
🧠 Conversation memory
🔄 Regenerate AI responses
✏️ Edit user messages
📋 Copy AI responses
📋 Copy code blocks
💡 Suggested follow-up prompts
🔎 Search through chat history
🌙 Light / Dark mode
📱 Fully responsive design
🛑 Stop AI response generation
⚠️ Error handling
🔐 Environment variable protection for API keys
🛠️ Technologies
Frontend
React
Vite
JavaScript
CSS3
React Markdown
Remark GFM
Backend
Node.js
Express.js
Groq SDK
Multer
CORS
dotenv
AI Models
Text: openai/gpt-oss-120b
Vision: qwen/qwen3.8-27b
Speech-to-Text: whisper-large-v3-turbo
Deployment
GitHub
Vercel
🏗️ Project Structure

AI-Noury/
│
├── api/
│ ├── chat.js
│ ├── index.js
│ └── transcribe.js
│
├── server/
│ └── server.js
│
├── src/
│ ├── components/
│ ├── services/
│ ├── App.jsx
│ ├── App.css
│ └── main.jsx
│
├── .env
├── .gitignore
├── package.json
├── vite.config.js
└── README.md

🚀 Getting Started
1. Clone the repository

git clone https://github.com/NouraTarek77/AI-Noury.git

2. Open the project

cd AI-Noury

3. Install dependencies

npm install

4. Create environment variables

Create a .env file in the project root:

GROQ_API_KEY=your_groq_api_key

Replace your_groq_api_key with your own Groq API key.

Never upload your .env file or expose your API key publicly.

5. Start the frontend

npm run dev

The frontend will normally run on:

http://localhost:5173

6. Start the backend

Open another terminal and run:

node server/server.js

The backend will run on:

http://localhost:5000

🔐 Environment Variables

The application requires:

GROQ_API_KEY=your_groq_api_key

The API key should be stored locally in .env and should never be committed to GitHub.

🖼️ Image Understanding

AI Noury can receive images and analyze their visible content.

Users can ask questions about:

Text inside images
Screenshots
Code screenshots
General visual content

The application automatically uses the vision model when an image is included.

🎤 Voice Input

AI Noury supports voice input using the browser's audio recording capabilities.

The recorded audio is sent to the backend and converted into text using:

whisper-large-v3-turbo

The transcribed text is then inserted into the chat input.

⚡ Streaming Responses

AI responses are streamed from the backend instead of waiting for the complete response.

This creates a more natural chat experience where the response appears progressively.

💾 Chat History

Chat conversations are stored locally using LocalStorage.

Users can:

Create new chats
Open previous chats
Search chat history
Delete individual chats
Clear all chats
🌙 Dark Mode

AI Noury supports both:

☀️ Light Mode
🌙 Dark Mode

The selected theme is saved locally so it remains available after refreshing the page.

📱 Responsive Design

The interface is designed to work across:

💻 Desktop
💻 Laptop
📱 Tablet
📱 Mobile

The sidebar automatically adapts to smaller screens.

🔄 AI Response Controls

After receiving a response, users can:

🔄 Regenerate the response
📋 Copy the complete response
📋 Copy individual code blocks
💡 Ask suggested follow-up questions
🧠 Conversation Memory

AI Noury uses the current conversation history to maintain context between messages.

The application can also provide explicitly saved user information to the AI when relevant.

🔐 Security

API keys are not stored in the frontend.

The Groq API key is stored as an environment variable on the backend and in Vercel's environment variables for production.

🚀 Deployment

The project is deployed using Vercel.

Frontend and API endpoints are connected through the deployed Vercel application.

Production URL

https://ai-noury.vercel.app

📌 Future Improvements

Possible future improvements include:

User authentication
Cloud database for conversations
More advanced long-term memory
File/document analysis
Multiple AI model selection
Conversation export
User profiles
More customization options
👩‍💻 Author

Noura Tarek

Computer Science Student & Front-End Developer

GitHub:
https://github.com/NouraTarek77

⭐ If you like the project, feel free to explore the repository and try the live demo.
