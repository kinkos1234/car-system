/*
  Warnings:

  - You are about to alter the column `completionDate` on the `CAR` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `BigInt`.
  - You are about to alter the column `dueDate` on the `CAR` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `BigInt`.
  - You are about to alter the column `issueDate` on the `CAR` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `BigInt`.
  - You are about to drop the column `flowId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WeeklyReport_weekStart_key";

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN "title" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAR" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "corporation" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "issueDate" BIGINT NOT NULL,
    "dueDate" BIGINT,
    "importance" REAL NOT NULL,
    "internalContact" TEXT,
    "receptionChannel" TEXT,
    "mainCategory" TEXT,
    "openIssue" TEXT,
    "followUpPlan" TEXT,
    "completionDate" BIGINT,
    "internalScore" REAL,
    "customerScore" REAL,
    "subjectiveScore" REAL,
    "score" REAL,
    "sentimentScore" REAL,
    "aiKeywords" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT "CAR_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CAR" ("aiKeywords", "completionDate", "corporation", "createdAt", "createdBy", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt") SELECT "aiKeywords", "completionDate", "corporation", "createdAt", "createdBy", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt" FROM "CAR";
DROP TABLE "CAR";
ALTER TABLE "new_CAR" RENAME TO "CAR";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT,
    "weeklyReportEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "id", "loginId", "name", "password", "role", "updatedAt") SELECT "createdAt", "department", "id", "loginId", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
