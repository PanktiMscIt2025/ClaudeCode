/*
  Warnings:

  - Added the required column `code` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topics" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueAt" DATETIME NOT NULL,
    "rubric" TEXT NOT NULL DEFAULT '[]',
    "blueprint" TEXT NOT NULL DEFAULT '{}',
    "generator" TEXT NOT NULL DEFAULT 'ai',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("courseId", "createdAt", "difficulty", "dueAt", "error", "id", "publishedAt", "questionCount", "status", "title", "topics", "totalMarks") SELECT "courseId", "createdAt", "difficulty", "dueAt", "error", "id", "publishedAt", "questionCount", "status", "title", "topics", "totalMarks" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
