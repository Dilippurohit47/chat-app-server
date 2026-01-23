# 💬 Not-A-Basic-Chat App — Backend (Node.js + TypeScript)

A powerful real-time backend for a chat application built with **Node.js + TypeScript**, featuring WebSockets messaging, JWT authentication, AI chatbot integration (Gemini), Redis caching, vector DB semantic memory, WebRTC signaling, Docker, CI/CD, and PostgreSQL database — fully deployed on a VPS.

---

## 🛠 Tech Stack

- Node.js + TypeScript  
- Express (HTTP Server)  
- WebSockets (WS)  
- PostgreSQL + Prisma ORM  
- Redis (Cache + Pub/Sub)  
- Vector Database (Qdrant )  
- Gemini AI (LLM chatbot)  
- Docker & Docker Compose  
- CI/CD (GitHub Actions)  
- PM2   
- WebRTC signaling server for call  
- VPS 

---

## 🚀 Clone & Setup

```bash
git clone https://github.com/Dilippurohit47/chat-app-server.git 
cd chat-app-backend
npm install
🔧 Environment Variables
Create a .env file:


env
Copy code
       
DATABASE_URL ="postgresql://postgres:password@localhost:5432/chat-app-v2?schema=public"
AWS_SECRET_KEY=""
AWS_ACCESS_KEY=""
AWS_REGION=us-east-1
JWT_SECRET = ""
REDIS_URL = ""
GEMINI_API_KEY =""
VECTOR_DB_URL_QUADRANT = ""
VECTOR_DB_QUADRANT_API_KEY = ""
# NODE_ENV = "production"    
NODE_ENV = "development"    
CLIENT_ID = "google auth client id "
CLIENT_SECRET = "google auth client secret"
PORT=8000

🗃 Database Setup

npx prisma generate
npx prisma migrate dev --name init

▶️ Start Development
npm run dev

```



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

