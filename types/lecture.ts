// Frontend types mirroring backend Prisma models
// These are used to avoid importing @prisma/client in the frontend

export enum LectureFileType {
  PDF = "PDF",
  DOCX = "DOCX",
  TXT = "TXT",
  IMAGE = "IMAGE",
}

export enum SummaryTone {
  CONCISE = "CONCISE",
  DETAILED = "DETAILED",
  SIMPLE = "SIMPLE",
  ACADEMIC = "ACADEMIC",
}

export interface Lecture {
  id: string;
  title: string;
  fileUrl: string;
  fileType: LectureFileType;
  extractedContent?: string | null;
  channelId: string;
  memberId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Summary {
  id: string;
  lectureId: string;
  tone: SummaryTone;
  contentMarkdown: string;
  createdAt: Date;
}

export interface Flashcard {
  id: string;
  lectureId: string;
  frontText: string;
  backText: string;
  createdAt: Date;
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  explanation?: string | null;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  lectureId: string;
  title: string;
  totalQuestions: number;
  createdAt: Date;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  memberId: string;
  score: number;
  createdAt: Date;
}
