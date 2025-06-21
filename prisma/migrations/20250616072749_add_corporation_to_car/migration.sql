/*
  Warnings:

  - Added the required column `corporation` to the `CAR` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAR" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "corporation" TEXT NOT NULL,
    "customerContactId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "importance" REAL NOT NULL,
    "internalContact" TEXT,
    "receptionChannel" TEXT,
    "mainCategory" TEXT,
    "openIssue" TEXT,
    "followUpPlan" TEXT,
    "completionDate" DATETIME,
    "internalScore" REAL,
    "customerScore" REAL,
    "subjectiveScore" REAL,
    "score" REAL,
    "sentimentScore" REAL,
    "aiKeywords" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT "CAR_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "CustomerContact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CAR_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CAR" ("aiKeywords", "completionDate", "createdAt", "createdBy", "customerContactId", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt") SELECT "aiKeywords", "completionDate", "createdAt", "createdBy", "customerContactId", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt" FROM "CAR";
DROP TABLE "CAR";
ALTER TABLE "new_CAR" RENAME TO "CAR";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
