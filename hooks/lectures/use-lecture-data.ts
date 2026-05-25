import { useState, useCallback } from "react";
import { useLectureService } from "@/services/lectures/lecture.service";
import { Lecture, Assessment } from "@/services/lectures/lecture.service";
import { useToast } from "@/hooks/use-toast";
import { SummaryTone } from "@/types/lecture";

export function useLectureData(lectureId: string | null) {
  const service = useLectureService();
  const { toast } = useToast();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<{
    [key: string]: boolean;
  }>({});

  const fetchLecture = useCallback(async () => {
    if (!lectureId) return;

    setLoading(true);
    try {
      const data = await service.getLectureById(lectureId);
      setLecture(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load lecture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [lectureId, service, toast]);

  const generateSummary = useCallback(
    async (tone: SummaryTone = SummaryTone.CONCISE) => {
      if (!lectureId) return;

      setGenerating((prev) => ({ ...prev, summary: true }));
      try {
        const result = await service.generateSummary(lectureId, { tone });
        
        setLecture((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            summary: result.summary,
          };
        });

        toast({
          title: "Success",
          description: result.message,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to generate summary",
          variant: "destructive",
        });
      } finally {
        setGenerating((prev) => ({ ...prev, summary: false }));
      }
    },
    [lectureId, service, toast]
  );

  const generateFlashcards = useCallback(
    async (count: number = 10) => {
      if (!lectureId) return;

      setGenerating((prev) => ({ ...prev, flashcards: true }));
      try {
        const result = await service.generateFlashcards(lectureId, { count });
        
        setLecture((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            flashcardSet: result.flashcardSet ?? {
              id: result.flashcards?.[0]?.flashcardSetId ?? "",
              lectureId: lectureId,
              createdAt: new Date().toISOString(),
              flashcards: result.flashcards,
            },
          };
        });

        toast({
          title: "Success",
          description: result.message,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to generate flashcards",
          variant: "destructive",
        });
      } finally {
        setGenerating((prev) => ({ ...prev, flashcards: false }));
      }
    },
    [lectureId, service, toast]
  );

  const generateQuiz = useCallback(
    async (questionCount: number = 5) => {
      if (!lectureId) return;

      setGenerating((prev) => ({ ...prev, quiz: true }));
      try {
        const result = await service.generateQuiz(lectureId, { questionCount });
        
        setLecture((prev) => {
          if (!prev) return prev;
          const newAssessment = result.assessment || result.quiz;
          return {
            ...prev,
            assessment: newAssessment ? { ...newAssessment, isDraft: true } : newAssessment,
          };
        });

        toast({
          title: "Success",
          description: result.message,
        });
        return ((result.assessment || result.quiz) ? { ...(result.assessment || result.quiz), isDraft: true } : null) as Assessment;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to generate assessment",
          variant: "destructive",
        });
        return null;
      } finally {
        setGenerating((prev) => ({ ...prev, quiz: false }));
      }
    },
    [lectureId, service, toast]
  );

  return {
    lecture,
    loading,
    generating,
    fetchLecture,
    generateSummary,
    generateFlashcards,
    generateQuiz,
  };
}
