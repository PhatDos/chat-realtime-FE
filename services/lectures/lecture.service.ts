import { useApiClient } from "@/hooks/use-api-client";
import { SummaryTone, LectureFileType } from "@/types/lecture";

export interface Lecture {
  id: string;
  title: string;
  fileUrl: string;
  fileType: LectureFileType;
  extractedContent?: string;
  channelId: string;
  memberId: string;
  createdAt: string;
  updatedAt: string;
  summaries?: Summary[];
  flashcards?: Flashcard[];
  quizzes?: Quiz[];
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

export interface Quiz {
  id: string;
  lectureId: string;
  title: string;
  totalQuestions: number;
  createdAt: string;
  questions?: QuizQuestion[];
  attempts?: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  explanation?: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  memberId: string;
  score: number;
  createdAt: string;
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

  return {
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
    getLecturesByChannel: async (channelId: string) => {
      return apiClient.get<Lecture[]>(`/lectures/channel/${channelId}`);
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
        quiz: Quiz;
        message: string;
      }>(`/lectures/${lectureId}/generate/quiz`, payload);
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
    getQuizzes: async (lectureId: string) => {
      return apiClient.get<Quiz[]>(`/lectures/${lectureId}/quizzes`);
    },

    /**
     * Submit quiz attempt
     */
    submitQuizAttempt: async (
      quizId: string,
      memberId: string,
      answers: Record<string, string>
    ) => {
      return apiClient.post<{
        success: boolean;
        attempt: QuizAttempt;
        score: number;
        correctCount: number;
        totalQuestions: number;
      }>(`/lectures/quiz/${quizId}/attempt`, {
        memberId,
        answers,
      });
    },
  };
}
