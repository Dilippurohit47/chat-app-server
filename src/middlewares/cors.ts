import cors from "cors"

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? []



export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // mobile / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});