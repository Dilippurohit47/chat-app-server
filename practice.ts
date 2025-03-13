import express, { json } from "express";
import http from "http";
import { WebSocketServer } from "ws";
const app = express();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clientMap = new Map();
let counter = 1;
wss.on("connection", (ws, req) => {
  let clientId = counter++;
  clientMap.set(clientId, ws);
  console.log(clientMap.size)
  ws.send(`you're connected your id is ${clientId} `);
  ws.on("message", (data) => {
    const m = JSON.parse(data);
    if(m.type === "personal-msg"){
        console.log(m.id)
        const user = clientMap.get(Number(m.id)) 
        if(user){
        user.send(m.message.toString())
        }else{
            console.log("user not found")
        }
        console.log(user) 
        ws.send("message sent")  
    }
  })
});

server.listen(8000, () => {
  console.log("server is running on 8000");
});
