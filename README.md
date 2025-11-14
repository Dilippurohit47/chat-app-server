# 💬 Chat App — Backend (Node.js + TypeScript)

A powerful real-time backend for a chat application built with **Node.js + TypeScript**, featuring WebSockets messaging, JWT authentication, AI chatbot integration (Gemini), Redis caching, vector DB semantic memory, WebRTC signaling, Docker, CI/CD, and PostgreSQL database — fully deployed on a VPS.

---

## 🛠 Tech Stack

- Node.js + TypeScript  
- Express (HTTP Server)  
- WebSockets (WS)  
- PostgreSQL + Prisma ORM  
- Redis (Cache + Pub/Sub)  
- Vector Database (Qdrant / Pinecone)  
- Gemini AI (LLM chatbot)  
- Docker & Docker Compose  
- CI/CD (GitHub Actions)  
- PM2 / Systemd (optional)  
- WebRTC signaling server  
- VPS (Ubuntu Linux)

---

## 🚀 Clone & Setup

```bash
git clone <your-backend-repo-url>
cd chat-app-backend
npm install
🔧 Environment Variables
Create a .env file:

env
Copy code
DATABASE_URL="postgresql://user:password@localhost:5432/chatdb"
REDIS_URL="redis://localhost:6379"

GEMINI_API_KEY="your_gemini_key"

VECTOR_DB_URL="your_vector_db_url"
VECTOR_DB_KEY="your_vector_db_key"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

PORT=8000
🗃 Database Setup
bash
Copy code
npx prisma generate
npx prisma migrate dev
▶️ Start Development
bash
Copy code
npm run dev
🐳 Docker Support
bash
Copy code
docker compose up --build
✨ Features (One-Line Each)
🔌 Real-time WebSocket messaging

👤 JWT authentication (access + refresh tokens)

🟢 Online/offline presence & status

💬 Typing indicator events

🔄 Message sync across devices

🤖 AI chatbot integration using Gemini API

🧠 Vector DB for chatbot memory & semantic responses

⚡ Redis caching + pub/sub for scalable real-time events

📞 WebRTC signaling for voice/video calls

🗃️ PostgreSQL storage via Prisma ORM

🐳 Dockerized backend for clean deployments

🚀 GitHub Actions CI/CD pipeline for VPS auto-deploy

🧯 Error handling + auto WebSocket reconnect logic

🔐 Secure token rotation system

📂 Project Structure
bash
Copy code
src/
 ├─ server.ts
 ├─ ws/               # WebSocket handlers
 ├─ prisma/           # Prisma schema + migrations
 ├─ controllers/      # Auth, chat, messaging logic
 ├─ services/         # Redis, AI, Vector DB, WebRTC
 ├─ middlewares/      # Auth, validation
 ├─ utils/            # Helpers, token utils
🧪 Testing
bash
Copy code
npm test
