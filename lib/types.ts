export type LessonSummary = {
  id: string;
  title: string;
  position: number;
  subtaskCount: number;
};

export type RosterStudent = {
  id: string;
  name: string;
  currentLessonIndex: number;
  completedInLesson: number;
  totalInLesson: number;
  totalCompleted: number;
  totalSubtasks: number;
};

export type RosterDto = {
  block: { id: string; name: string };
  lessons: LessonSummary[];
  students: RosterStudent[];
};

export type SubtaskDetail = {
  id: string;
  title: string;
  completed: boolean;
};

export type LessonDetail = {
  id: string;
  title: string;
  subtasks: SubtaskDetail[];
};

export type StudentDetailDto = {
  student: { id: string; name: string };
  lessons: LessonDetail[];
};
