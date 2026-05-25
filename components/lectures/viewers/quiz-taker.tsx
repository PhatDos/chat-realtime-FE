"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AssessmentAttempt, StudentQuizAssessment, StudentQuizOption, SubmitAssessmentAttemptResponse } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { LoadingOverlay } from "@/components/common/loading-overlay";

interface QuizTakerProps {
  quiz: StudentQuizAssessment;
  attempt?: Pick<AssessmentAttempt, "startedAt" | "status"> | null;
  onSubmit: (answers: Record<string, string>) => Promise<SubmitAssessmentAttemptResponse>;
  onSubmitted?: (response: SubmitAssessmentAttemptResponse) => void;
  isSubmitting: boolean;
}

const formatTimeLeft = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export function QuizTaker({ quiz, attempt, onSubmit, onSubmitted, isSubmitting }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);
  const autoSubmitTriggeredRef = useRef(false);

  const deadlineMs = attempt?.startedAt && quiz.durationMinutes
    ? new Date(attempt.startedAt).getTime() + quiz.durationMinutes * 60 * 1000
    : null;
  const [remainingMs, setRemainingMs] = useState<number | null>(deadlineMs ? Math.max(deadlineMs - Date.now(), 0) : null);

  const submitQuiz = useCallback(async () => {
    if (submitted || isSubmitting) {
      return;
    }

    const response = await onSubmit(answers);

    if (onSubmitted) {
      onSubmitted(response);
      return;
    }

    setResult({
      score: response.score,
      correctCount: response.correctCount,
      totalQuestions: response.totalQuestions,
    });
    setSubmitted(true);
  }, [answers, isSubmitting, onSubmit, onSubmitted, submitted]);

  useEffect(() => {
    autoSubmitTriggeredRef.current = false;

    if (!deadlineMs || submitted || result) {
      setRemainingMs(deadlineMs ? Math.max(deadlineMs - Date.now(), 0) : null);
      return;
    }

    const updateRemaining = () => {
      const nextRemaining = deadlineMs - Date.now();
      setRemainingMs(Math.max(nextRemaining, 0));

      if (nextRemaining <= 0 && !autoSubmitTriggeredRef.current && !isSubmitting) {
        autoSubmitTriggeredRef.current = true;
        void submitQuiz();
      }
    };

    updateRemaining();

    const timerId = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [deadlineMs, isSubmitting, result, submitQuiz, submitted]);

  if (!quiz.questions || quiz.questions.length === 0) {
    return <div className="text-center text-slate-300">No questions</div>;
  }

  if (submitted && result) {
    return (
      <Card className="p-8 text-center space-y-4 border border-white/10 bg-white/5 rounded-2xl shadow-2xl shadow-black/30">
        <h3 className="text-2xl font-bold text-white">Quiz Complete!</h3>
        <div className="text-4xl font-bold text-cyan-200">
          {result.score.toFixed(1)}%
        </div>
        <div className="text-slate-300">
          You answered {result.correctCount} out of {result.totalQuestions} questions correctly
        </div>
        <Button onClick={() => {
          setSubmitted(false);
          setResult(null);
          setAnswers({});
          setCurrentQuestionIndex(0);
        }} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          Retake Quiz
        </Button>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  const isAnswered = !!selectedAnswer;

  const handleSelectAnswer = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions!.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const allAnswered = quiz.questions!.length === Object.keys(answers).length;
  const isTimeRunningOut = remainingMs !== null && remainingMs <= 5 * 60 * 1000;
  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} text="Submitting..." />

      <div className="space-y-6">
        {deadlineMs ? (
          <Card
            className={`flex items-center justify-between gap-4 border px-4 py-3 rounded-2xl ${isTimeRunningOut ? "border-amber-400/30 bg-amber-400/10" : "border-cyan-400/20 bg-cyan-400/10"}`}
          >
            <div>
              <div className={`text-xs uppercase tracking-[0.24em] ${isTimeRunningOut ? "text-amber-200/80" : "text-cyan-200/80"}`}>
                Time remaining
              </div>
              <div className={`text-2xl font-bold ${isTimeRunningOut ? "text-amber-100" : "text-cyan-100"}`}>
                {remainingMs !== null ? formatTimeLeft(remainingMs) : "--:--"}
              </div>
            </div>
            <div className={`text-sm ${isTimeRunningOut ? "text-amber-100/80" : "text-cyan-100/80"}`}>
              {remainingMs !== null && remainingMs <= 0 ? "Submitting now..." : `Started at ${attempt?.startedAt ? new Date(attempt.startedAt).toLocaleString() : "-"}`}
            </div>
          </Card>
        ) : null}

        <div className="text-sm text-slate-300">
          Question {currentQuestionIndex + 1} of {quiz.questions!.length}
        </div>

        <Card className="p-6 space-y-6 border border-white/10 bg-white/5 rounded-2xl">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">
              {currentQuestion.questionText}
            </h3>

            <RadioGroup value={selectedAnswer || ""} onValueChange={handleSelectAnswer}>
              <div className="space-y-3">
                {currentQuestion.options.map((option: StudentQuizOption) => {
                  let optionClass = 'flex items-center space-x-2 p-3 border border-white/10 rounded-lg cursor-pointer transition-colors';

                  // add hover styles when the question hasn't been answered yet
                  if (!isAnswered) {
                    optionClass += ' hover:bg-white/5 hover:border-white/20';
                  }

                  if (isAnswered) {
                    if (option.id === selectedAnswer) {
                      optionClass += ' border-2 border-cyan-400/40 bg-cyan-400/10';
                    }
                  }

                  return (
                    <div key={option.id} className={optionClass}>
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer text-slate-200">
                        {option.optionText}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {isAnswered && (
            <div className="space-y-2">
            </div>
          )}
        </Card>

        <div className="flex gap-2 justify-between">
          <Button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="border-white/10 text-slate-200"
          >
            Previous
          </Button>

          {currentQuestionIndex < quiz.questions!.length - 1 ? (
            <Button onClick={handleNext} disabled={!isAnswered} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Next
            </Button>
          ) : (
            <Button
              onClick={() => {
                void submitQuiz();
              }}
              disabled={!allAnswered || isSubmitting}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
