import { WebSocketServer } from "ws";
import { logWarn } from "../../helper";

export const messageHandler = async (data ,ws:WebSocket,wss:WebSocketServer)=>{
switch (data.type) {

    default:
        logWarn(`Unknown handler type ${data.type}`)
}

}