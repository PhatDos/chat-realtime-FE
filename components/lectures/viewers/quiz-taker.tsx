"use client";

import { useState } from "react";
import { Quiz, QuizOption, SubmitAssessmentAttemptResponse } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { LoadingOverlay } from "@/components/common/loading-overlay";

interface QuizTakerProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => Promise<SubmitAssessmentAttemptResponse>;
  onSubmitted?: (response: SubmitAssessmentAttemptResponse) => void;
  isSubmitting: boolean;
}

export function QuizTaker({ quiz, onSubmit, onSubmitted, isSubmitting }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

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

  const selectedOption = currentQuestion.options.find((o) => o.id === selectedAnswer);
  const isAnswered = !!selectedAnswer;
  const isSelectedCorrect = !!selectedOption && selectedOption.isCorrect;
  const correctOptionIndex = currentQuestion.options.findIndex((o) => o.isCorrect);
  const correctOptionLetter = correctOptionIndex >= 0 ? String.fromCharCode(65 + correctOptionIndex) : null;

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

  const handleSubmit = async () => {
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
  };

  const allAnswered = quiz.questions!.length === Object.keys(answers).length;
  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} text="Submitting..." />

      <div className="space-y-6">
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
                {currentQuestion.options.map((option: QuizOption) => {
                  let optionClass = 'flex items-center space-x-2 p-3 border border-white/10 rounded-lg cursor-pointer transition-colors';

                  // add hover styles when the question hasn't been answered yet
                  if (!isAnswered) {
                    optionClass += ' hover:bg-white/5 hover:border-white/20';
                  }

                  if (isAnswered) {
                    if (option.id === selectedAnswer) {
                      optionClass += option.isCorrect ? ' border-2 border-green-500 bg-green-50/30' : ' border-2 border-red-500 bg-red-50/30';
                    } else if (option.isCorrect) {
                      optionClass += ' border-2 border-green-200 bg-green-50/20';
                    }
                  }

                  return (
                    <div key={option.id} className={optionClass}>
                      <RadioGroupItem value={option.id} id={option.id} disabled={isAnswered} />
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
              <div className={isSelectedCorrect ? 'p-3 rounded bg-green-50 text-green-700 font-medium' : 'rounded text-red-700 font-medium'}>
                {isSelectedCorrect ? 'Correct' : 'Incorrect'}
              </div>

              {!isSelectedCorrect && correctOptionLetter && (
                <div className="text-sm text-green-400 font-medium">Correct answer: {correctOptionLetter}</div>
              )}

              {currentQuestion.explanation && (
                <div className="p-4 bg-cyan-400/10 rounded-lg">
                  <div className="text-sm font-medium mb-2 text-white">Explanation:</div>
                  <div className="text-sm text-slate-200">{currentQuestion.explanation}</div>
                </div>
              )}
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
              onClick={handleSubmit}
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
