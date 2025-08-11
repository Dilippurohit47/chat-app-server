-- CreateTable
CREATE TABLE "DeletedGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "DeletedGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeletedGroup" ADD CONSTRAINT "DeletedGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedGroup" ADD CONSTRAINT "DeletedGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
