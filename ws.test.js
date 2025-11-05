import ws from "k6/ws";
import { check } from "k6";

export const options = {
  scenarios: {
    connections: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2  m", target: 10000 }, 
        { duration: "3m", target: 10000 }, 
      ],
    },
  },
};

export default function () {
  const res = ws.connect("ws://localhost:8080", {}, (socket) => {
    socket.on("open", () => {});
    socket.setInterval(() => {}, 10000); // keep alive only
  });

  check(res, { "connected": (r) => r && r.status === 101 });
}
