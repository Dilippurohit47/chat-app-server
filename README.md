# 💬 Full Stack Chat App — (Frontend + Backend)

A complete real-time chat application built with **React + Node.js + TypeScript**, featuring WebSockets, JWT auth, chatbot (Gemini AI), Redis caching, vector DB memory, WebRTC calling, Docker deployment, and CI/CD automation — all hosted on a VPS.

---

## 🛠 Tech Stack (Full System)

- **Frontend:** React, WebSockets, Redux, Tailwind CSS
- **Backend:** Node.js, TypeScript, Express, WebSockets
- **Database:** PostgreSQL + Prisma ORM
- **Cache / PubSub:** Redis
- **AI:** Google Gemini API
- **Vector DB:** Qdrant / Pinecone (semantic context)
- **Calls:** WebRTC Signaling
- **Deployment:** Docker + VPS + Nginx
- **CI/CD:** GitHub Actions
- **Others:** JWT Auth, Secure Cookies

---

# 🚀 Clone & Setup (Both Projects)

## 🔹 Frontend Setup

```bash
git clone https://github.com/Dilippurohit47/chat-app-client.git
cd chat-app-client
npm install
npm run dev

🔹 Backend Setup
git clone <your-backend-repo-url>
cd chat-app-backend
npm install

🔧 Environment Variables (Backend)

Create a .env file inside the backend:

DATABASE_URL="postgresql://user:password@localhost:5432/chatdb"
REDIS_URL="redis://localhost:6379"

GEMINI_API_KEY="your_gemini_key"

VECTOR_DB_URL="your_vector_db_url"
VECTOR_DB_KEY="your_vector_db_key"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

PORT=8000

🗃 Database Setup (Backend)
npx prisma generate
npx prisma migrate dev

🐳 Docker (Backend)
docker compose up --build

✨ Features (One-Line Each)

🔌 Real-time WebSocket messaging

👤 JWT authentication (access + refresh tokens)

🟢 Online/offline presence system

💬 Typing indicator

🔄 Message syncing across devices

🤖 AI chatbot (Gemini API)

🧠 Vector DB memory for chatbot

⚡ Redis caching + pub/sub for scaling

📞 WebRTC signaling for audio/video calls

🔍 User search system

🧵 One-to-one chat support

🖼 Responsive UI

🐳 Dockerized backend

🚀 CI/CD pipeline for automatic VPS deployment

📂 Prisma + PostgreSQL storage

🔁 Auto WebSocket reconnect + error handling

📂 Project Structure (Backend)
src/
 ├─ server.ts
 ├─ ws/
 ├─ prisma/
 ├─ controllers/
 ├─ services/
 ├─ middlewares/
 ├─ utils/

📁 Project Structure (Frontend)
src/
 ├─ components/
 ├─ pages/
 ├─ store/ (Redux)
 ├─ websocket/
 ├─ hooks/
 ├─ utils/
