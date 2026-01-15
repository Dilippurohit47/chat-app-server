/*
  Warnings:

  - The values [read] on the enum `MessageStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageStatus_new" AS ENUM ('sent', 'delivered', 'seen');
ALTER TABLE "Messages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Messages" ALTER COLUMN "status" TYPE "MessageStatus_new" USING ("status"::text::"MessageStatus_new");
ALTER TYPE "MessageStatus" RENAME TO "MessageStatus_old";
ALTER TYPE "MessageStatus_new" RENAME TO "MessageStatus";
DROP TYPE "MessageStatus_old";
ALTER TABLE "Messages" ALTER COLUMN "status" SET DEFAULT 'sent';
COMMIT;
