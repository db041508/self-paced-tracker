-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_name_key" ON "Teacher"("name");

-- Backfill: create a default teacher to own all existing demo data
INSERT INTO "Teacher" ("id", "name", "updatedAt")
VALUES ('cm_default_teacher_lane', 'Lane', CURRENT_TIMESTAMP);

-- AlterTable: add teacherId as nullable first so existing rows don't break
ALTER TABLE "Block" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "teacherId" TEXT;

-- Backfill existing rows onto the default teacher
UPDATE "Block" SET "teacherId" = 'cm_default_teacher_lane' WHERE "teacherId" IS NULL;
UPDATE "Lesson" SET "teacherId" = 'cm_default_teacher_lane' WHERE "teacherId" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Block" ALTER COLUMN "teacherId" SET NOT NULL;
ALTER TABLE "Lesson" ALTER COLUMN "teacherId" SET NOT NULL;

-- Replace old global-uniqueness indexes with per-teacher-scoped ones
DROP INDEX "Block_name_key";
DROP INDEX "Lesson_position_key";
CREATE UNIQUE INDEX "Block_teacherId_name_key" ON "Block"("teacherId", "name");
CREATE UNIQUE INDEX "Lesson_teacherId_position_key" ON "Lesson"("teacherId", "position");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: many-to-many join between Lesson and Block
CREATE TABLE "LessonBlock" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,

    CONSTRAINT "LessonBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonBlock_lessonId_blockId_key" ON "LessonBlock"("lessonId", "blockId");

ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing lesson was already visible on every existing block
INSERT INTO "LessonBlock" ("id", "lessonId", "blockId")
SELECT gen_random_uuid()::text, l."id", b."id"
FROM "Lesson" l
CROSS JOIN "Block" b
WHERE l."teacherId" = b."teacherId";
