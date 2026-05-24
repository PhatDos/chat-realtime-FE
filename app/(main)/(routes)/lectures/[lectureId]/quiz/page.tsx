"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowLeft, CalendarDays, Clock3, Loader2, ShieldAlert } from "lucide-react";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { useLectureService } from "@/services/lectures/lecture.service";
import type { AssessmentAttempt, SubmitAssessmentAttemptResponse } from "@/services/lectures/lecture.service";
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
  const { lecture, loading, fetchLecture } = useLectureData(lectureId as string);
  const [isSubmittingAssessmentAttempt, setIsSubmittingAssessmentAttempt] = useState(false);
  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const backHref =
    serverId && channelId
      ? `/lectures/${lectureId as string}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}&view=student`
      : `/lectures/${lectureId as string}`;
  const assessment = lecture?.assessment ?? null;
  const currentAttempt = useMemo(() => {
    if (!assessment || !memberId) {
      return null;
    }

    return assessment.attempts?.find((attempt) => attempt.memberId === memberId && Boolean(attempt.submittedAt)) ?? null;
  }, [assessment, memberId]);

  const buildSubmitResponse = (attempt: AssessmentAttempt): SubmitAssessmentAttemptResponse => {
    const totalQuestions = attempt.assessment?.totalQuestions ?? attempt.answers?.length ?? 0;
    const correctCount = attempt.answers?.reduce((count, answer) => count + (answer.isCorrect ? 1 : 0), 0) ?? 0;
    const finalScore = attempt.finalScore;
    const score = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;

    return {
      success: true,
      attempt,
      score,
      correctCount,
      totalQuestions,
      totalPoints: attempt.assessment?.totalPoints,
      finalScore,
    };
  };

  const getAttemptHref = (attemptId: string) =>
    `/lectures/${lectureId as string}/assessment-attempts/${attemptId}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`;

  const handleBack = () => {
    router.push(backHref);
  };

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    setIsSubmittingAssessmentAttempt(true);

    try {
      return await lectureService.submitAssessmentAttempt(assessment.id, memberId, answers);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        const refreshedLecture = await lectureService.getLectureById(lectureId as string);
        const refreshedAttempt = refreshedLecture.assessment?.attempts?.find(
          (attempt) => attempt.memberId === memberId && Boolean(attempt.submittedAt)
        );

        if (refreshedAttempt) {
          toast({
            title: "Already submitted",
            description: "You have already completed this quiz. Opening your attempt.",
          });
          router.push(getAttemptHref(refreshedAttempt.id));
          return buildSubmitResponse(refreshedAttempt);
        }
      }

      if (isAxiosError(error) && error.response?.status === 403) {
        toast({
          title: "Assessment expired",
          description: "This quiz can no longer be submitted.",
        });
      }

      throw error;
    } finally {
      setIsSubmittingAssessmentAttempt(false);
    }
  };

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture, lectureId]);

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!lecture || !assessment) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-slate-300">Quiz not found</p>
        </Card>
      </div>
    );
  }

  const deadlineLabel = assessment.expiresAt ? new Date(assessment.expiresAt).toLocaleString() : "No deadline";
  const durationLabel = assessment.durationMinutes ? `${assessment.durationMinutes} minutes` : "No time limit";
  const isExpired = Boolean(assessment.expiresAt && new Date(assessment.expiresAt) < new Date());

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <LoadingOverlay isLoading={isSubmittingAssessmentAttempt} text="Submitting..." />
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

        <Card className="border border-white/10 bg-white/5 p-6 rounded-2xl space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{assessment.title}</h1>
            <p className="text-sm text-slate-400">
              {assessment.type} · {assessment.status} · {assessment.totalQuestions} questions
            </p>
            {assessment.description ? <p className="text-sm text-slate-300">{assessment.description}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Deadline</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                <CalendarDays className="h-4 w-4 text-cyan-400" />
                {deadlineLabel}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Duration</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                <Clock3 className="h-4 w-4 text-cyan-400" />
                {durationLabel}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Late submission</div>
              <div className="mt-1 text-sm text-slate-200">
                {assessment.allowLateSubmission ? "Allowed by owner" : "Not allowed"}
              </div>
            </div>
          </div>
        </Card>

        {isExpired ? (
          <Card className="border border-amber-400/20 bg-amber-400/5 p-6 rounded-2xl space-y-3">
            <p className="text-sm font-medium text-amber-200">This quiz has expired</p>
            <p className="text-sm text-slate-300">The deadline has passed, so new submissions are blocked.</p>
            {currentAttempt ? (
              <Button
                type="button"
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={() => router.push(getAttemptHref(currentAttempt.id))}
              >
                View your attempt
              </Button>
            ) : null}
          </Card>
        ) : currentAttempt ? (
          <Card className="border border-emerald-400/20 bg-emerald-400/5 p-6 rounded-2xl space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-200">You already submitted this quiz</p>
              <p className="text-sm text-slate-300">
                Submitted at {currentAttempt.submittedAt ? new Date(currentAttempt.submittedAt).toLocaleString() : "-"}
              </p>
              <p className="text-sm text-slate-300">Final score: {currentAttempt.finalScore.toFixed(1)}</p>
            </div>

            <Button
              type="button"
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => router.push(getAttemptHref(currentAttempt.id))}
            >
              View attempt
            </Button>
          </Card>
        ) : (
          <QuizTaker
            quiz={assessment}
            onSubmit={handleSubmit}
            onSubmitted={(response) => {
              router.push(getAttemptHref(response.attempt.id));
            }}
            isSubmitting={isSubmittingAssessmentAttempt}
          />
        )}
      </div>
    </div>
  );
}
