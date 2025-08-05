-- CreateTable
CREATE TABLE "DeletedChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "DeletedChat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeletedChat" ADD CONSTRAINT "DeletedChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedChat" ADD CONSTRAINT "DeletedChat_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
