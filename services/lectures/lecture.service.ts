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
  summaries?: Summary[];
  flashcards?: Flashcard[];
  assessments?: Assessment[];
  quizzes?: Assessment[];
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
  lectureId: string;
  frontText: string;
  backText: string;
  createdAt: string;
}

export interface Assessment {
  id: string;
  lectureId?: string | null;
  channelId: string;
  createdById: string;
  title: string;
  description?: string | null;
  type: 'QUIZ' | 'ASSIGNMENT';
  generatedByAI: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  totalQuestions: number;
  totalPoints: number;
  durationMinutes?: number | null;
  allowReview: boolean;
  allowLateSubmission: boolean;
  expiresAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  questions?: AssessmentQuestion[];
  attempts?: AssessmentAttempt[];
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  order: number;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY';
  points: number;
  explanation?: string;
  options: AssessmentOption[];
  answers?: AssessmentAnswer[];
}

export interface AssessmentOption {
  id: string;
  questionId: string;
  order: number;
  optionText: string;
  isCorrect: boolean;
}

export interface AssessmentAnswer {
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
}

export type Quiz = Assessment;
export type QuizQuestion = AssessmentQuestion;
export type QuizOption = AssessmentOption;
export type QuizAttempt = AssessmentAttempt;

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  memberId: string;
  startedAt?: string;
  submittedAt?: string | null;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED' | 'RETURNED' | 'EXPIRED';
  isLate?: boolean;
  autoScore: number;
  teacherAdjustment: number;
  finalScore: number;
  teacherComment?: string | null;
  gradedAt?: string | null;
  gradedById?: string | null;
  createdAt: string;
  answers?: AssessmentAnswer[];
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
          message: string;
        }>(`/lectures/${lectureId}/generate/flashcards`, payload);
      },

      /**
       * Generate quiz for a lecture
       */
      generateQuiz: async (lectureId: string, payload: GenerateQuizPayload) => {
        return apiClient.post<{
          success: boolean;
          assessment: Assessment;
          quiz: Assessment;
          message: string;
        }>(`/lectures/${lectureId}/generate/assessment`, payload);
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
      getAssessments: async (lectureId: string) => {
        return apiClient.get<Assessment[]>(`/lectures/${lectureId}/assessments`);
      },

      getQuizzes: async (lectureId: string) => {
        return apiClient.get<Assessment[]>(`/lectures/${lectureId}/quizzes`);
      },

      /**
       * Submit quiz attempt
       */
      submitAssessmentAttempt: async (
        assessmentId: string,
        memberId: string,
        answers: Record<string, string>
      ) => {
        return apiClient.post<{
          success: boolean;
          attempt: AssessmentAttempt;
          score: number;
          correctCount: number;
          totalQuestions: number;
          totalPoints?: number;
          finalScore?: number;
        }>(`/lectures/assessment/${assessmentId}/attempt`, {
          memberId,
          answers,
        });
      },

      submitQuizAttempt: async (quizId: string, memberId: string, answers: Record<string, string>) => {
        return apiClient.post<{
          success: boolean;
          attempt: AssessmentAttempt;
          score: number;
          correctCount: number;
          totalQuestions: number;
          totalPoints?: number;
          finalScore?: number;
        }>(`/lectures/quiz/${quizId}/attempt`, {
          memberId,
          answers,
        });
      },

      updateAssessment: async (assessmentId: string, payload: Partial<Assessment>) => {
        return apiClient.patch<Assessment>(`/lectures/assessment/${assessmentId}`, payload);
      },

      addAssessmentQuestion: async (
        assessmentId: string,
        payload: {
          questionText: string;
          type?: 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY';
          points?: number;
          explanation?: string | null;
          options?: Array<{ optionText: string; isCorrect?: boolean; order?: number }>;
          order?: number;
        }
      ) => {
        return apiClient.post<AssessmentQuestion>(`/lectures/assessment/${assessmentId}/questions`, payload);
      },

      updateAssessmentQuestion: async (
        questionId: string,
        payload: Partial<Pick<AssessmentQuestion, 'questionText' | 'type' | 'points' | 'explanation' | 'order'>>
      ) => {
        return apiClient.patch<AssessmentQuestion>(`/lectures/assessment/questions/${questionId}`, payload);
      },

      deleteAssessmentQuestion: async (questionId: string) => {
        return apiClient.delete<{ success: boolean }>(`/lectures/assessment/questions/${questionId}`);
      },

      addAssessmentOption: async (
        questionId: string,
        payload: { optionText: string; isCorrect?: boolean; order?: number }
      ) => {
        return apiClient.post<AssessmentOption>(`/lectures/assessment/questions/${questionId}/options`, payload);
      },

      updateAssessmentOption: async (
        optionId: string,
        payload: Partial<Pick<AssessmentOption, 'optionText' | 'isCorrect' | 'order'>>
      ) => {
        return apiClient.patch<AssessmentOption>(`/lectures/assessment/options/${optionId}`, payload);
      },

      deleteAssessmentOption: async (optionId: string) => {
        return apiClient.delete<{ success: boolean }>(`/lectures/assessment/options/${optionId}`);
      },

      publishAssessment: async (assessmentId: string) => {
        return apiClient.patch<Assessment>(`/lectures/assessment/${assessmentId}/publish`);
      },

      closeAssessment: async (assessmentId: string) => {
        return apiClient.patch<Assessment>(`/lectures/assessment/${assessmentId}/close`);
      },

      archiveAssessment: async (assessmentId: string) => {
        return apiClient.patch<Assessment>(`/lectures/assessment/${assessmentId}/archive`);
      },

      getAssessmentById: async (assessmentId: string) => {
        return apiClient.get<Assessment>(`/lectures/assessment/${assessmentId}`);
      },

      getAssessmentReview: async (lectureId: string, assessmentId: string) => {
        return apiClient.get<Assessment>(`/lectures/${lectureId}/assessment/${assessmentId}/review`);
      },

      getAssessmentLeaderboard: async (channelId: string) => {
        return apiClient.get<AssessmentAttempt[]>(`/lectures/channel/${channelId}/leaderboard`);
      },

      gradeAssessmentAttempt: async (
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
        return apiClient.patch<AssessmentAttempt>(`/lectures/assessment/attempts/${attemptId}/grade`, payload);
      },

      revealAssessment: async (assessmentId: string) => {
        return apiClient.get<Assessment>(`/lectures/assessment/${assessmentId}/reveal`);
      },
    }),
    [apiClient]
  );
}
