"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useLectureService, type AssessmentAttempt } from "@/services/lectures/lecture.service";
import { LoadingOverlay } from "@/components/common/loading-overlay";

interface QuestionSnapshotOption {
  id?: string;
  order?: number;
  optionText?: string;
  isCorrect?: boolean;
}

interface QuestionSnapshot {
  id?: string;
  order?: number;
  questionText?: string;
  type?: string;
  points?: number;
  explanation?: string | null;
  options?: QuestionSnapshotOption[];
}

export default function AssessmentAttemptDetailPage() {
  const { lectureId, attemptId } = useParams<{ lectureId: string; attemptId: string }>();
  const router = useRouter();
  const lectureService = useLectureService();

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAttempt = async () => {
      try {
        const data = await lectureService.getAssessmentAttempt(attemptId);
        if (mounted) {
          setAttempt(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAttempt();

    return () => {
      mounted = false;
    };
  }, [attemptId, lectureService]);

  const backHref = useMemo(
    () => `/lectures/${lectureId}/assessment-editor?assessmentId=${attempt?.assessmentId ?? ""}`,
    [attempt?.assessmentId, lectureId],
  );

  const handleBack = () => {
    setIsNavigating(true);
    router.push(backHref);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading attempt...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-slate-300">Assessment attempt not found</p>
          <div className="mt-4">
            <Button onClick={handleBack} disabled={isNavigating} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalQuestions = attempt.assessment?.totalQuestions ?? 0;
  const score = totalQuestions > 0 ? (attempt.finalScore / totalQuestions) * 100 : 0;

  const answers = attempt.answers ?? [];

  const getOptionClassName = (option: QuestionSnapshotOption, selectedOptionId?: string | null) => {
    const isSelected = option.id === selectedOptionId;
    const isCorrect = Boolean(option.isCorrect);

    if (isSelected && isCorrect) {
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
    }

    if (isSelected) {
      return "border-rose-400/40 bg-rose-400/10 text-rose-100";
    }

    if (isCorrect) {
      return "border-cyan-400/30 bg-cyan-400/5 text-cyan-100";
    }

    return "border-white/10 bg-slate-950/30 text-slate-200";
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <LoadingOverlay isLoading={isNavigating} text="Navigating..." />
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handleBack}
            disabled={isNavigating}
            variant="ghost"
            size="sm"
            className="group border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to editor
          </Button>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200">
            Attempt detail
          </div>
        </div>

        <Card className="border border-white/10 bg-white/5 p-6 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Assessment</p>
              <h1 className="text-3xl font-bold text-white">{attempt.assessment?.title ?? "Assessment attempt"}</h1>
              <p className="text-sm text-slate-300 mt-1">
                Status: {attempt.status ?? "SUBMITTED"} · Questions: {totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Score</div>
              <div className="text-4xl font-bold text-cyan-200">{score.toFixed(1)}%</div>
              <div className="text-sm text-slate-300">Final score: {attempt.finalScore.toFixed(1)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-slate-400">Member</div>
              <div className="text-white">{attempt.member?.profile?.name ?? attempt.memberId}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-slate-400">Submitted at</div>
              <div className="text-white">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "-"}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-slate-400">Auto score</div>
              <div className="text-white">{attempt.autoScore.toFixed(1)}</div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {answers.map((answer, index) => {
            const snapshot = answer.questionSnapshot as QuestionSnapshot | undefined;
            const options = snapshot?.options ?? attempt.assessment?.questions?.find((q) => q.id === answer.questionId)?.options ?? [];
            const selectedOption = options.find((option) => option.id === answer.selectedOptionId);
            const correctOption = options.find((option) => option.isCorrect);
            const isCorrect = answer.isCorrect ?? selectedOption?.isCorrect ?? false;

            return (
              <Card key={answer.id} className="border border-white/10 bg-white/5 p-5 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">Question {snapshot?.order ?? index + 1}</p>
                    <h3 className="text-lg font-semibold text-white">{snapshot?.questionText ?? answer.questionId}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${isCorrect ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {isCorrect ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-slate-400 mb-1">Selected answer</div>
                    <div className="text-white">{selectedOption?.optionText ?? answer.answerText ?? "No answer"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-slate-400 mb-1">Correct answer</div>
                    <div className="text-white">{correctOption?.optionText ?? "-"}</div>
                  </div>
                </div>

                {options.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium text-white">All options</div>
                    <div className="grid grid-cols-1 gap-2">
                      {options.map((option) => {
                        const isSelected = option.id === answer.selectedOptionId;
                        const isCorrect = Boolean(option.isCorrect);

                        return (
                          <div
                            key={option.id ?? `${answer.id}-${option.order ?? option.optionText}`}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${getOptionClassName(option, answer.selectedOptionId)}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-slate-400 uppercase tracking-[0.2em] text-xs">
                                {String.fromCharCode(65 + (option.order ? option.order - 1 : options.indexOf(option)))}
                              </div>
                              <div>{option.optionText ?? "-"}</div>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium">
                              {isSelected && (
                                <span className="rounded-full border border-current px-2 py-0.5">Selected</span>
                              )}
                              {isCorrect && (
                                <span className="rounded-full border border-current px-2 py-0.5">Correct</span>
                              )}
                              {!isSelected && !isCorrect && (
                                <span className="rounded-full border border-current px-2 py-0.5 text-slate-400">Wrong</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : answer.answerText ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-slate-400 mb-1">Submitted text</div>
                    <div className="text-white whitespace-pre-wrap">{answer.answerText}</div>
                  </div>
                ) : null}

                {snapshot?.explanation ? (
                  <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                    <div className="text-sm font-medium text-white mb-1">Explanation</div>
                    <div className="text-sm text-slate-200">{snapshot.explanation}</div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
