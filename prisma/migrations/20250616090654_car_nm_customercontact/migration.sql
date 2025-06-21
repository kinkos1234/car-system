/*
  Warnings:

  - You are about to drop the column `customerContactId` on the `CAR` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CarCustomerContact" (
    "carId" INTEGER NOT NULL,
    "customerContactId" INTEGER NOT NULL,

    PRIMARY KEY ("carId", "customerContactId"),
    CONSTRAINT "CarCustomerContact_carId_fkey" FOREIGN KEY ("carId") REFERENCES "CAR" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CarCustomerContact_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "CustomerContact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAR" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "corporation" TEXT NOT NULL,
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
    CONSTRAINT "CAR_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CAR" ("aiKeywords", "completionDate", "corporation", "createdAt", "createdBy", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt") SELECT "aiKeywords", "completionDate", "corporation", "createdAt", "createdBy", "customerScore", "dueDate", "eventType", "followUpPlan", "id", "importance", "internalContact", "internalScore", "issueDate", "mainCategory", "openIssue", "receptionChannel", "score", "sentimentScore", "subjectiveScore", "updatedAt" FROM "CAR";
DROP TABLE "CAR";
ALTER TABLE "new_CAR" RENAME TO "CAR";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
