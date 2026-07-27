import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_SUBTASKS = ["Lesson", "Practice", "Mastery"];

const LESSON_TITLES = [
  "Lesson 1: Intro",
  "Lesson 2: Basics",
  "Lesson 3: Practice",
  "Lesson 4: Application",
  "Lesson 5: Review",
  "Lesson 6: Deep Dive",
  "Lesson 7: Project",
  "Lesson 8: Assessment",
];

// Each entry: [studentName, [numberOfSubtasksCompleted per lesson index, ...]]
const STUDENT_PROGRESS: [string, number[]][] = [
  ["Ava Johnson", [3, 3, 2]],
  ["Elijah Martinez", [3]],
  ["Emma Davis", [3]],
  ["Liam Smith", [2]],
  ["Noah Brown", []],
  ["Olivia Wilson", [3, 3, 3, 1]],
];

async function main() {
  const lessons = [];
  for (let i = 0; i < LESSON_TITLES.length; i++) {
    const lesson = await prisma.lesson.upsert({
      where: { position: i },
      update: { title: LESSON_TITLES[i] },
      create: { title: LESSON_TITLES[i], position: i },
    });
    lessons.push(lesson);

    for (let s = 0; s < DEFAULT_SUBTASKS.length; s++) {
      await prisma.subtask.upsert({
        where: { lessonId_position: { lessonId: lesson.id, position: s } },
        update: { title: DEFAULT_SUBTASKS[s] },
        create: { lessonId: lesson.id, title: DEFAULT_SUBTASKS[s], position: s },
      });
    }
  }

  const subtasksByLesson = await prisma.lesson.findMany({
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });

  const block = await prisma.block.upsert({
    where: { name: "Period 1" },
    update: {},
    create: { name: "Period 1" },
  });

  for (const [name, progress] of STUDENT_PROGRESS) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await bcrypt.hash(pin, 10);
    const student = await prisma.student.upsert({
      where: { blockId_name: { blockId: block.id, name } },
      update: {},
      create: { blockId: block.id, name, pinHash },
    });
    console.log(`${name}: PIN ${pin}`);

    for (let lessonIndex = 0; lessonIndex < subtasksByLesson.length; lessonIndex++) {
      const completedCount = progress[lessonIndex] ?? 0;
      const subtasks = subtasksByLesson[lessonIndex].subtasks;
      for (let s = 0; s < subtasks.length; s++) {
        const completed = s < completedCount;
        await prisma.subtaskCompletion.upsert({
          where: {
            studentId_subtaskId: { studentId: student.id, subtaskId: subtasks[s].id },
          },
          update: {},
          create: {
            studentId: student.id,
            subtaskId: subtasks[s].id,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
