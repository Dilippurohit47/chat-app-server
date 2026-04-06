import ws from "k6/ws";
import { sleep } from "k6";

export default function () {
  ws.connect("ws://localhost:8080", {}, function (socket) {

    socket.on("open", () => {
      // register user ONCE
      socket.send(JSON.stringify({
        type: "user-info",
        userId: String(__VU)
      }));

      // then send messages
      socket.setInterval(() => {
        socket.send(JSON.stringify({
          type: "load-test",
          senderId: String(__VU),
          message: "hello"
        }));
      }, 50);
    });

  });

  sleep(60);
}