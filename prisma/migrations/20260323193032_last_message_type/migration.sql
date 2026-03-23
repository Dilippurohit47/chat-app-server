-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'MEDIA');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "lastMessageType" "MessageType" NOT NULL DEFAULT 'TEXT';
