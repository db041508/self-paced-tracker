import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_SUBTASKS = ["Lesson", "Practice", "Mastery"];

type TeacherSeed = {
  teacherName: string;
  blockName: string;
  lessonTitles: string[];
  // Each entry: [studentName, [numberOfSubtasksCompleted per lesson index, ...]]
  students: [string, number[]][];
};

const TEACHERS: TeacherSeed[] = [
  {
    teacherName: "Lane",
    blockName: "Period 1",
    lessonTitles: [
      "Lesson 1: Intro",
      "Lesson 2: Basics",
      "Lesson 3: Practice",
      "Lesson 4: Application",
      "Lesson 5: Review",
      "Lesson 6: Deep Dive",
      "Lesson 7: Project",
      "Lesson 8: Assessment",
    ],
    students: [
      ["Ava Johnson", [3, 3, 2]],
      ["Elijah Martinez", [3]],
      ["Emma Davis", [3]],
      ["Liam Smith", [2]],
      ["Noah Brown", []],
      ["Olivia Wilson", [3, 3, 3, 1]],
    ],
  },
  {
    teacherName: "Jennings",
    blockName: "Period 2",
    lessonTitles: [
      "Unit 1: Foundations",
      "Unit 2: Structures",
      "Unit 3: Forces",
      "Unit 4: Lab Project",
    ],
    students: [
      ["Maya Chen", [3, 1]],
      ["Jordan Lee", [3, 3, 3, 2]],
      ["Priya Patel", []],
      ["Sam Rivera", [2]],
    ],
  },
];

async function seedTeacher(seed: TeacherSeed) {
  const teacher = await prisma.teacher.upsert({
    where: { name: seed.teacherName },
    update: {},
    create: { name: seed.teacherName },
  });

  const lessons = [];
  for (let i = 0; i < seed.lessonTitles.length; i++) {
    const lesson = await prisma.lesson.upsert({
      where: { teacherId_position: { teacherId: teacher.id, position: i } },
      update: { title: seed.lessonTitles[i] },
      create: { teacherId: teacher.id, title: seed.lessonTitles[i], position: i },
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

  const block = await prisma.block.upsert({
    where: { teacherId_name: { teacherId: teacher.id, name: seed.blockName } },
    update: {},
    create: { teacherId: teacher.id, name: seed.blockName },
  });

  for (const lesson of lessons) {
    await prisma.lessonBlock.upsert({
      where: { lessonId_blockId: { lessonId: lesson.id, blockId: block.id } },
      update: {},
      create: { lessonId: lesson.id, blockId: block.id },
    });
  }

  const subtasksByLesson = await prisma.lesson.findMany({
    where: { teacherId: teacher.id },
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });

  for (const [name, progress] of seed.students) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await bcrypt.hash(pin, 10);
    const student = await prisma.student.upsert({
      where: { blockId_name: { blockId: block.id, name } },
      update: {},
      create: { blockId: block.id, name, pinHash },
    });
    console.log(`${seed.teacherName} / ${name}: PIN ${pin}`);

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
}

async function main() {
  for (const seed of TEACHERS) {
    await seedTeacher(seed);
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
