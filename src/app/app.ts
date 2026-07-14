import express from "express";
import userAuth from "../routes/userAuth";
import Messages from "../routes/messages"; 
import Chat from "../routes/chat"; 
import cookieParser from "cookie-parser";
import awsRoute from "../infra/aws/presignedUrl"; 
import groupRoute from "../routes/group";
import rateLimit from "express-rate-limit";
import { corsMiddleware } from "../middlewares/cors";
import { connectPostgres } from "../infra/database/testDb";
export const app = express(); 
app.use(express.json()); 
app.set("trust proxy", 1);
app.use(corsMiddleware);
app.use(cookieParser());

// only testing purpose
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 1000 ,  
  message: "Too many requests, slow down!",
});

app.get("/",(req,res)=>{
  res.status(200).json(`Hello from ${process.env.PORT}`)
})

app.get("/health",(req,res)=>{
  res.status(200).send("ok")
})

app.use("/user", apiLimiter ,  userAuth); 
app.use("/chat",apiLimiter , Messages); 
app.use("/aws",apiLimiter , awsRoute);
app.use("/group",apiLimiter, groupRoute);
app.use("/chat-setting",apiLimiter, Chat); 
connectPostgres()
app.get("/health", (req, res) => {  
  res.send("server is live by ci/cd pipelines v1");
});

