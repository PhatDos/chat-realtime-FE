"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useLectureService } from "@/services/lectures/lecture.service";
import type { QuizAttempt, StudentQuizQuiz } from "@/services/lectures/lecture.service";
import { QuizTaker } from "@/components/lectures/viewers/quiz-taker";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LectureQuizPage() {
  const { lectureId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureService = useLectureService();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const [quiz, setQuiz] = useState<StudentQuizQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [isSubmittingQuizAttempt, setIsSubmittingQuizAttempt] = useState(false);
  const [startedAttempt, setStartedAttempt] = useState<QuizAttempt | null>(null);
  const [isStartingAttempt, setIsStartingAttempt] = useState(false);
  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const backHref =
    serverId && channelId
      ? `/lectures/${lectureId as string}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}&view=student`
      : "/newsfeed";
  const currentAttempt = startedAttempt;
  const submittedAttempt = currentAttempt?.submittedAt ? currentAttempt : null;

  const getAttemptHref = (attemptId: string) =>
    `/lectures/${lectureId as string}/quiz-attempts/${attemptId}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBack = () => {
    router.push(backHref);
  };

  useEffect(() => {
    const loadQuiz = async () => {
      setLoadingQuiz(true);

      try {
        const data = await lectureService.getStudentQuiz(lectureId as string);

        if (isMountedRef.current) {
          setQuiz(data);
        }
      } catch (error) {
        if (isMountedRef.current) {
          toast({
            title: "Quiz not found",
            description: "Please go back and open the quiz again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingQuiz(false);
        }
      }
    };

    void loadQuiz();
  }, [lectureId, lectureService, toast]);

  useEffect(() => {
    const ensureAttempt = async () => {
      if (!quiz || !memberId || currentAttempt || isStartingAttempt) {
        return;
      }

      setIsStartingAttempt(true);

      try {
        const attempt = await lectureService.startQuizAttempt(quiz.id, memberId);

        if (isMountedRef.current) {
          setStartedAttempt(attempt);
        }
      } catch (error) {
        if (isMountedRef.current) {
          toast({
            title: "Unable to start quiz",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsStartingAttempt(false);
        }
      }
    };

    void ensureAttempt();
  }, [currentAttempt, isStartingAttempt, lectureService, memberId, quiz, toast]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    setIsSubmittingQuizAttempt(true);

    try {
      return await lectureService.submitQuizAttempt(quiz.id, memberId, answers);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast({
          title: "Already submitted",
          description: "You have already completed this quiz.",
        });
        router.push(backHref);
      }

      if (isAxiosError(error) && error.response?.status === 403) {
        toast({
          title: "Quiz expired",
          description: "This quiz can no longer be submitted because the deadline has passed.",
        });
      }

      throw error;
    } finally {
      setIsSubmittingQuizAttempt(false);
    }
  };

  if (loadingQuiz) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-slate-300">Quiz not found</p>
        </Card>
      </div>
    );
  }

  const isExpired = Boolean(!currentAttempt && quiz.expiresAt && new Date(quiz.expiresAt) < new Date());

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <LoadingOverlay isLoading={isSubmittingQuizAttempt} text="Submitting..." />
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className="group border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to lecture
          </Button>

          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200">
            <ShieldAlert className="h-4 w-4" />
            Student quiz
          </div>
        </div>

        <Card className="border border-white/10 bg-white/5 p-6 rounded-2xl space-y-2">
          <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-400">
            {quiz.type} · {quiz.status} · {quiz.totalQuestions} questions
          </p>
          {quiz.description ? <p className="text-sm text-slate-300">{quiz.description}</p> : null}
        </Card>

        {isStartingAttempt && !currentAttempt ? (
          <Card className="border border-white/10 bg-white/5 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <p className="text-sm font-medium text-slate-200">Starting quiz session...</p>
            </div>
            <p className="text-sm text-slate-300">The timer is being initialized from the server.</p>
          </Card>
        ) : isExpired ? (
          <Card className="border border-amber-400/20 bg-amber-400/5 p-6 rounded-2xl space-y-3">
            <p className="text-sm font-medium text-amber-200">This quiz has expired</p>
            <p className="text-sm text-slate-300">The deadline has passed, so new submissions are blocked.</p>
            {submittedAttempt ? (
              <Button
                type="button"
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={() => router.push(getAttemptHref(submittedAttempt.id))}
              >
                View your attempt
              </Button>
            ) : null}
          </Card>
        ) : submittedAttempt ? (
          <Card className="border border-emerald-400/20 bg-emerald-400/5 p-6 rounded-2xl space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-200">You already submitted this quiz</p>
              <p className="text-sm text-slate-300">Submitted at {submittedAttempt.submittedAt ? new Date(submittedAttempt.submittedAt).toLocaleString() : "-"}</p>
              <p className="text-sm text-slate-300">
                Score: {submittedAttempt.scorePercent.toFixed(1)}% · Final score: {submittedAttempt.finalScore.toFixed(1)}
              </p>
            </div>

            <Button
              type="button"
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => router.push(getAttemptHref(submittedAttempt.id))}
            >
              View attempt
            </Button>
          </Card>
        ) : (
          <QuizTaker
            quiz={quiz}
            attempt={currentAttempt}
            onSubmit={handleSubmit}
            onSubmitted={(response) => {
              router.push(getAttemptHref(response.attempt.id));
            }}
            isSubmitting={isSubmittingQuizAttempt}
          />
        )}
      </div>
    </div>
  );
}
