import { useApiClient } from "@/hooks/use-api-client";
import { useMemo } from "react";
import { SummaryTone, LectureFileType } from "@/types/lecture";
import { MemberWithProfileResponse } from "@/types/api/member";

export interface Lecture {
  id: string;
  title: string;
  fileUrl: string;
  fileType: LectureFileType;
  extractedContent?: string;
  channelId: string;
  memberId: string;
  member?: MemberWithProfileResponse;
  createdAt: string;
  updatedAt: string;
  summary?: Summary | null;
  flashcardSet?: FlashcardSet | null;
  quiz?: Quiz | null;
}

export interface LectureFileRow {
  id: string;
  title: string;
  fileUrl: string;
  fileType: LectureFileType;
  createdAt: string;
  uploadedBy: string;
}

export interface Summary {
  id: string;
  lectureId: string;
  tone: SummaryTone;
  contentMarkdown: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  flashcardSetId: string;
  order: number;
  frontText: string;
  backText: string;
  createdAt: string;
}

export interface FlashcardSet {
  id: string;
  lectureId: string;
  createdAt: string;
  flashcards?: Flashcard[];
}

export interface Quiz {
  id: string;
  lectureId?: string | null;
  channelId: string;
  createdById: string;
  title: string;
  description?: string | null;
  type: 'QUIZ';
  generatedByAI: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  totalQuestions: number;
  totalPoints: number;
  durationMinutes?: number | null;
  allowLateSubmission: boolean;
  expiresAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
  questions?: QuizQuestion[];
  attempts?: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  order: number;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY';
  points: number;
  explanation?: string;
  options: QuizOption[];
  answers?: QuizAnswer[];
}

export interface StudentQuizOption {
  id: string;
  questionId: string;
  order: number;
  optionText: string;
}

export interface StudentQuizQuestion {
  id: string;
  quizId: string;
  order: number;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY';
  points: number;
  options: StudentQuizOption[];
}

export interface StudentQuiz {
  id: string;
  lectureId?: string | null;
  channelId: string;
  createdById: string;
  title: string;
  description?: string | null;
  type: 'QUIZ';
  generatedByAI: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  totalQuestions: number;
  totalPoints: number;
  durationMinutes?: number | null;
  allowLateSubmission: boolean;
  expiresAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  questions: StudentQuizQuestion[];
}

export type StudentQuizQuiz = StudentQuiz;

export interface QuizOption {
  id: string;
  questionId: string;
  order: number;
  optionText: string;
  isCorrect: boolean;
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isCorrect?: boolean | null;
  autoPoints?: number | null;
  teacherAdjustedPoints?: number | null;
  finalPoints?: number | null;
  teacherFeedback?: string | null;
  gradedAt?: string | null;
  questionSnapshot?: unknown;
}


export interface QuizAttempt {
  id: string;
  quizId: string;
  memberId: string;
  startedAt?: string;
  submittedAt?: string | null;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED' | 'RETURNED' | 'EXPIRED';
  isLate?: boolean;
  autoScore: number;
  scorePercent: number;
  teacherAdjustment: number;
  finalScore: number;
  teacherComment?: string | null;
  gradedAt?: string | null;
  gradedById?: string | null;
  createdAt: string;
  answers?: QuizAnswer[];
  quiz?: Quiz;
  member?: MemberWithProfileResponse;
  gradedBy?: MemberWithProfileResponse | null;
}

export interface ChannelLeaderboardQuizScore {
  quizId: string;
  scorePercent: number | null;
  finalScore: number | null;
  submittedAt: string | null;
}

export interface ChannelLeaderboardQuiz {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChannelLeaderboardEntry {
  memberId: string;
  member: MemberWithProfileResponse | null;
  quizScores: ChannelLeaderboardQuizScore[];
  totalScore: number;
  lastActivityAt?: string | null;
}

export interface ChannelLeaderboardResponse {
  channelId: string;
  channelName: string;
  quizzes: ChannelLeaderboardQuiz[];
  entries: ChannelLeaderboardEntry[];
}

export interface SubmitQuizAttemptResponse {
  success: boolean;
  attempt: QuizAttempt;
  score: number;
  scorePercent?: number;
  correctCount: number;
  totalQuestions: number;
  totalPoints?: number;
  finalScore?: number;
}

export interface CreateLecturePayload {
  title: string;
  fileUrl: string;
  fileType: LectureFileType;
  channelId: string;
  memberId: string;
}

export interface GenerateSummaryPayload {
  tone: SummaryTone;
}

export interface GenerateFlashcardsPayload {
  count: number;
}

export interface GenerateQuizPayload {
  questionCount: number;
}

export interface CreateQuizPayload {
  title: string;
  description?: string | null;
  type?: Quiz['type'];
  status?: Quiz['status'];
  totalPoints?: number;
  durationMinutes?: number | null;
  allowLateSubmission?: boolean;
  expiresAt?: string | null;
  generatedByAI?: boolean;
  questions: Array<{
    questionText: string;
    type?: QuizQuestion['type'];
    points?: number;
    explanation?: string | null;
    order?: number;
    options?: Array<{
      optionText: string;
      isCorrect?: boolean;
      order?: number;
    }>;
  }>;
}

/**
 * Lecture Service - API calls for lecture operations
 */
export function useLectureService() {
  const apiClient = useApiClient();

  return useMemo(
    () => ({
      /**
       * Create a new lecture
       */
      createLecture: async (payload: CreateLecturePayload) => {
        return apiClient.post<{
          success: boolean;
          lecture: Lecture;
          message: string;
        }>("/lectures", payload);
      },

      /**
       * Get lecture by ID
       */
      getLectureById: async (lectureId: string) => {
        return apiClient.get<Lecture>(`/lectures/${lectureId}`);
      },

      getStudentQuiz: async (lectureId: string) => {
        return apiClient.get<StudentQuiz>(`/lectures/${lectureId}/quiz`);
      },

      getLectureFiles: async (lectureId: string) => {
        return apiClient.get<LectureFileRow[]>(`/lectures/${lectureId}/files`);
      },

      /**
       * Get all lectures for a channel
       */
      getLecturesByChannel: async (serverId: string, channelId: string) => {
        return apiClient.get<Lecture[]>(`/lectures/channel/${serverId}/${channelId}`);
      },

      /**
       * Generate summary for a lecture
       */
      generateSummary: async (lectureId: string, payload: GenerateSummaryPayload) => {
        return apiClient.post<{
          success: boolean;
          summary: Summary;
          message: string;
        }>(`/lectures/${lectureId}/generate/summary`, payload);
      },

      /**
       * Generate flashcards for a lecture
       */
      generateFlashcards: async (lectureId: string, payload: GenerateFlashcardsPayload) => {
        return apiClient.post<{
          success: boolean;
          count: number;
          flashcards: Flashcard[];
          flashcardSet?: FlashcardSet | null;
          message: string;
        }>(`/lectures/${lectureId}/generate/flashcards`, payload);
      },

      /**
       * Generate quiz for a lecture
       */
      generateQuiz: async (lectureId: string, payload: GenerateQuizPayload) => {
        return apiClient.post<{
          success: boolean;
          quiz: Quiz;
          message: string;
        }>(`/lectures/${lectureId}/generate/quiz`, payload);
      },

      createQuiz: async (lectureId: string, payload: CreateQuizPayload) => {
        return apiClient.post<Quiz>(`/lectures/${lectureId}/quiz`, payload);
      },

      getQuizAttempt: async (attemptId: string) => {
        return apiClient.get<QuizAttempt>(`/lectures/quiz/attempts/${attemptId}`);
      },

      startQuizAttempt: async (quizId: string, memberId: string) => {
        return apiClient.post<QuizAttempt>(`/lectures/quiz/${quizId}/attempt/start`, {
          memberId,
        });
      },

      /**
       * Get flashcards for a lecture
       */
      getFlashcards: async (lectureId: string) => {
        return apiClient.get<Flashcard[]>(`/lectures/${lectureId}/flashcards`);
      },

      /**
       * Get quizzes for a lecture
       */
      getquizzes: async (lectureId: string) => {
        return apiClient.get<Quiz[]>(`/lectures/${lectureId}/quizzes`);
      },


      /**
       * Submit quiz attempt
       */
      submitQuizAttempt: async (
        quizId: string,
        memberId: string,
        answers: Record<string, string>,
      ) => {
        return apiClient.post<SubmitQuizAttemptResponse>(`/lectures/quiz/${quizId}/attempt`, {
          memberId,
          answers,
        });
      },


      updateQuiz: async (quizId: string, payload: Partial<Quiz>) => {
        return apiClient.patch<Quiz>(`/lectures/quiz/${quizId}`, payload);
      },

      addQuizQuestion: async (
        quizId: string,
        payload: {
          questionText: string;
          type?: 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY';
          points?: number;
          explanation?: string | null;
          options?: Array<{ optionText: string; isCorrect?: boolean; order?: number }>;
          order?: number;
        }
      ) => {
        return apiClient.post<QuizQuestion>(`/lectures/quiz/${quizId}/questions`, payload);
      },

      updateQuizQuestion: async (
        questionId: string,
        payload: Partial<Pick<QuizQuestion, 'questionText' | 'type' | 'points' | 'explanation' | 'order'>> & {
          options?: Array<{
            id: string;
            optionText?: string;
            isCorrect?: boolean;
            order?: number;
          }>;
        }
      ) => {
        return apiClient.patch<QuizQuestion>(`/lectures/quiz/questions/${questionId}`, payload);
      },

      deleteQuizQuestion: async (questionId: string) => {
        return apiClient.delete<{ success: boolean }>(`/lectures/quiz/questions/${questionId}`);
      },

      publishQuiz: async (quizId: string) => {
        return apiClient.patch<Quiz>(`/lectures/quiz/${quizId}/publish`);
      },

      closeQuiz: async (quizId: string) => {
        return apiClient.patch<Quiz>(`/lectures/quiz/${quizId}/close`);
      },

      archiveQuiz: async (quizId: string) => {
        return apiClient.patch<Quiz>(`/lectures/quiz/${quizId}/archive`);
      },

      getQuizById: async (quizId: string) => {
        return apiClient.get<Quiz>(`/lectures/quiz/${quizId}`);
      },

      getQuizReview: async (lectureId: string, quizId: string) => {
        return apiClient.get<Quiz>(`/lectures/${lectureId}/quiz/${quizId}/review`);
      },

      getQuizLeaderboard: async (channelId: string) => {
        return apiClient.get<ChannelLeaderboardResponse>(`/lectures/channel/${channelId}/leaderboard`);
      },

      gradeQuizAttempt: async (
        attemptId: string,
        payload: {
          teacherAdjustment?: number;
          teacherComment?: string;
          answers?: Array<{
            answerId: string;
            teacherAdjustedPoints?: number;
            teacherFeedback?: string;
          }>;
          gradedById?: string;
          status?: 'GRADED' | 'RETURNED' | 'GRADING';
        }
      ) => {
        return apiClient.patch<QuizAttempt>(`/lectures/quiz/attempts/${attemptId}/grade`, payload);
      },

      revealQuiz: async (quizId: string) => {
        return apiClient.get<Quiz>(`/lectures/quiz/${quizId}/reveal`);
      },
    }),
    [apiClient]
  );
}
