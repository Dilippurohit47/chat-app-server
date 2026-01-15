-- CreateTable
CREATE TABLE "HabitTrackerUsers" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitTrackerUsers_pkey" PRIMARY KEY ("id")
);
