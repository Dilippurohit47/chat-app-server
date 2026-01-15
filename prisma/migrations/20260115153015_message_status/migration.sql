-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read');

-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'sent';
