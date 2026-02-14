


export const createRedisMessageHandler = ({ saveMessage  ,sendRecentChats ,messageAcknowledge ,redis , prisma ,getUserSocket ,isUserConnected}) => {
  return async (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === "ping") return;
    if (data.type === "personal-msg") {
      const receiverId = data.receiverId;
      if (data.senderId && receiverId && data.receiverContent) {
       let {messageSent , messageId}:{messageSent:boolean , messageId:string | null} =  await saveMessage(data.tempId,data.senderId, receiverId, data.isMedia ,data.receiverContent ,data.senderContent); 
       if(!messageSent) return
       
       if(isUserConnected(data.senderId)){
        let ws  = getUserSocket(data.senderId)
        ws.send(JSON.stringify({
          type:"message-acknowledge",
          messages:[{id:messageId , clientSideMessageId:data.tempId ,status:'sent'}],
        }))
       }

         if (isUserConnected(receiverId)) {
        let ws  = getUserSocket(receiverId);
        ws.send(
          JSON.stringify({
            type: "personal-msg",
            receiverContent: data.receiverContent,
            senderContent: data.senderContent,
            receiverId: receiverId, 
            senderId: data.senderId, 
            isMedia:data.isMedia || false,
            id:data.tempId
          })
        );
      }
        const senderRecentChats = await sendRecentChats(data.senderId);
        const receiverRecentChats = await sendRecentChats(data.receiverId);
        if(senderRecentChats){
  redis.set( `user:${data.senderId}:chats`,JSON.stringify(senderRecentChats),{
              EX:60*10
            })
        }
        if(receiverRecentChats){
          
         redis.set( `user:${data.receiverId}:chats`,JSON.stringify(receiverRecentChats), { 
              EX:60*10 
            })
        }
       
        if (isUserConnected(data.senderId)) {
          let senderWs = getUserSocket(data.senderId);
          if (senderWs && senderWs.readyState === 1) {
            senderWs.send(
              JSON.stringify({ 
                type: "recent-chats",
                chats: senderRecentChats,
              })
            ); 
          }
        } 

        if (isUserConnected(receiverId)) {
          let receiverWs = getUserSocket(receiverId);
          if (receiverWs && receiverWs.readyState === 1) { 
            receiverWs.send(
              JSON.stringify({
                type: "recent-chats", 
                chats: receiverRecentChats,
              })
            );
          } else {
            console.log(`❌ WebSocket not open for receiver (${receiverId})`); 
          }
        }     
      }
 
 
    }
    if (data.type === "group-message") {
      const groupId = data.groupId;
      const groupMembers = await prisma.group.findFirst({
        where: {
          id: groupId,
        }, 
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      });
      groupMembers?.members.map((user) => {
        if (user.userId === data.message.senderId) {
          return;
        }
        const ws = getUserSocket(user.userId);
        if (ws) {
          ws?.send(
            JSON.stringify({
              type: "group-message",
              content: data.message.content,
              senderId: data.message.senderId,
            })
          );
        }
      });
    }

       if(data.type === "typing"){
      const ws = getUserSocket(data.receiverId)
      if(ws){
        ws.send(JSON.stringify({
          type:"user-is-typing",
          senderId:data.senderId
        }))
      }
    }
    if(data.type === "typing-stop"){
      const ws = getUserSocket(data.receiverId)
      if(ws){
        ws.send(JSON.stringify({
          type:"user-stopped-typing",
          senderId:data.senderId
        }))
      }
    }

    if (data.type === "send-groups") {
      const userId = data.userId;
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
          deletedby: {
            none: {
              userId: userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
      if (groups.length <= 0) {
        const ws = getUserSocket(userId);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "get-groups-ws",
              groups: [],
            })
          );
        }
        return;
      }
      if (groups.length > 0) {
        const userIds = groups
          .map((group) => group.members?.map((user) => user.userId))
          .flatMap((id) => id);
        userIds.map((id) => {
          if (isUserConnected(id)) {
            const ws = getUserSocket(id);
            const getPerUserGroup = async () => {
              const group = await prisma.group.findMany({
                where: {
                  members: {
                    some: {
                      userId: id,
                    },
                  },
                  deletedby: {
                    none: {
                      userId: id,
                    },
                  },
                },
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
                },
              });
              ws.send(
                JSON.stringify({
                  type: "get-groups-ws",
                  groups: group,
                })
              );
            };
            getPerUserGroup();
          }
        });
      }
    }
    if(data.type === "message-acknowledge"){
      const updatedMessages = await messageAcknowledge({chatId:data.chatId ,senderId:data.senderId,receiverId:data.receiverId})
      if(isUserConnected(data.senderId)){
        let ws = getUserSocket(data.senderId)
        if(ws){
          ws.send(JSON.stringify({
            type:"message-acknowledge",
            messages:updatedMessages
          }))
        }
        console.log("messages send")
      }
      
    }
}
}