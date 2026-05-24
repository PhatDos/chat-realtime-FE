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
  assessment?: Assessment | null;
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
  allowLateSubmission: boolean;
  expiresAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
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
  questionSnapshot?: unknown;
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
  scorePercent: number;
  teacherAdjustment: number;
  finalScore: number;
  teacherComment?: string | null;
  gradedAt?: string | null;
  gradedById?: string | null;
  createdAt: string;
  answers?: AssessmentAnswer[];
  assessment?: Assessment;
  member?: MemberWithProfileResponse;
  gradedBy?: MemberWithProfileResponse | null;
}

export interface ChannelLeaderboardAssignmentScore {
  assessmentId: string;
  scorePercent: number | null;
  finalScore: number | null;
  submittedAt: string | null;
}

export interface ChannelLeaderboardAssessment {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChannelLeaderboardEntry {
  memberId: string;
  member: MemberWithProfileResponse | null;
  assignmentScores: ChannelLeaderboardAssignmentScore[];
  totalScore: number;
  lastActivityAt?: string | null;
}

export interface ChannelLeaderboardResponse {
  channelId: string;
  channelName: string;
  assessments: ChannelLeaderboardAssessment[];
  entries: ChannelLeaderboardEntry[];
}

export interface SubmitAssessmentAttemptResponse {
  success: boolean;
  attempt: AssessmentAttempt;
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

export interface CreateAssessmentPayload {
  title: string;
  description?: string | null;
  type?: Assessment['type'];
  status?: Assessment['status'];
  totalPoints?: number;
  durationMinutes?: number | null;
  allowLateSubmission?: boolean;
  expiresAt?: string | null;
  generatedByAI?: boolean;
  questions: Array<{
    questionText: string;
    type?: AssessmentQuestion['type'];
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
          assessment: Assessment;
          quiz: Assessment;
          message: string;
        }>(`/lectures/${lectureId}/generate/assessment`, payload);
      },

      createAssessment: async (lectureId: string, payload: CreateAssessmentPayload) => {
        return apiClient.post<Assessment>(`/lectures/${lectureId}/assessment`, payload);
      },

      getAssessmentAttempt: async (attemptId: string) => {
        return apiClient.get<AssessmentAttempt>(`/lectures/assessment/attempts/${attemptId}`);
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
      ): Promise<SubmitAssessmentAttemptResponse> => {
        return apiClient.post<SubmitAssessmentAttemptResponse>(`/lectures/assessment/${assessmentId}/attempt`, {
          memberId,
          answers,
        });
      },

      submitQuizAttempt: async (quizId: string, memberId: string, answers: Record<string, string>) => {
        return apiClient.post<SubmitAssessmentAttemptResponse>(`/lectures/quiz/${quizId}/attempt`, {
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
        payload: Partial<Pick<AssessmentQuestion, 'questionText' | 'type' | 'points' | 'explanation' | 'order'>> & {
          options?: Array<{
            id: string;
            optionText?: string;
            isCorrect?: boolean;
            order?: number;
          }>;
        }
      ) => {
        return apiClient.patch<AssessmentQuestion>(`/lectures/assessment/questions/${questionId}`, payload);
      },

      deleteAssessmentQuestion: async (questionId: string) => {
        return apiClient.delete<{ success: boolean }>(`/lectures/assessment/questions/${questionId}`);
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
        return apiClient.get<ChannelLeaderboardResponse>(`/lectures/channel/${channelId}/leaderboard`);
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
