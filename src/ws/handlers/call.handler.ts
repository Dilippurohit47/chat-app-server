import { getUserSocket } from "../connectionManager";

const sendToUser = (userId: string, payload: unknown) => {
  const ws = getUserSocket(userId);
  if (!ws) return;
  ws.send(JSON.stringify(payload));
};

export const callHandler = async (data) => { 
  switch (data.type) {
    case "offer":
      return handleOffer(data);

    case "answer":
      return handleAnswer(data);

    case "ice-candidate":
      return handleIceCandidate(data);

    case "audio-vedio-toggle":
      return handleAudioVideoToggle(data);

    case "someone-is-calling":
      return handleIncomingCall(data);

    case "call-status":
      return handleCallStatus(data);

    default:
      console.warn("Unknown call event:", data.type);
  }
};

const handleOffer = (data) => {
  sendToUser(data.receiverId, {
    type: "offer",
    offer: data.offer,
  });
};

const handleAnswer = (data) => {
  sendToUser(data.receiverId, {
    type: "answer",
    answer: data.answer,
  });
};

const handleIceCandidate = (data) => {
  sendToUser(data.receiverId, {
    type: "ice-candidate",
    candidate: data.candidate,
  });
};

const handleAudioVideoToggle = (data) => {
  sendToUser(data.receiverId, {
    type: "audio-video-toggle",
    audio: data.audio,
    video: data.video,
  });
};

const handleIncomingCall = (data) => {
  sendToUser(data.callReceiverId, {
    type: "someone-is-calling",
    callerData: data.callerData,
  });
};


const handleCallStatus = (data) => {
  if (data.callStatus === "hang-up") {
    sendToUser(data.callReceiverId, {
      type: "client-call-status",
      callStatus: "hang-up",
    });
  }

  if (data.callStatus === "accepted") {
    sendToUser(data.receiverId, {
      type: "client-call-status",
      callStatus: "accepted",
    });
  }
};
