"use client";

import { useState } from "react";
import { Quiz, QuizOption } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface QuizTakerProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  isSubmitting: boolean;
}

export function QuizTaker({ quiz, onSubmit, isSubmitting }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  if (!quiz.questions || quiz.questions.length === 0) {
    return <div className="text-center text-muted-foreground">No questions</div>;
  }

  if (submitted && result) {
    return (
      <Card className="p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold">Quiz Complete!</h3>
        <div className="text-4xl font-bold text-primary">
          {result.score.toFixed(1)}%
        </div>
        <div className="text-muted-foreground">
          You answered {result.correctCount} out of {result.totalQuestions} questions correctly
        </div>
        <Button onClick={() => {
          setSubmitted(false);
          setResult(null);
          setAnswers({});
          setCurrentQuestionIndex(0);
        }}>
          Retake Quiz
        </Button>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

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
    await onSubmit(answers);
    setSubmitted(true);
  };

  const isAnswered = !!selectedAnswer;
  const allAnswered = quiz.questions!.length === Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Question {currentQuestionIndex + 1} of {quiz.questions!.length}
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {currentQuestion.questionText}
          </h3>

          <RadioGroup value={selectedAnswer || ""} onValueChange={handleSelectAnswer}>
            <div className="space-y-3">
              {currentQuestion.options.map((option: QuizOption) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary cursor-pointer">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {selectedAnswer && currentQuestion.explanation && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium mb-2">Explanation:</div>
            <div className="text-sm">{currentQuestion.explanation}</div>
          </div>
        )}
      </Card>

      <div className="flex gap-2 justify-between">
        <Button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          Previous
        </Button>

        {currentQuestionIndex < quiz.questions!.length - 1 ? (
          <Button onClick={handleNext} disabled={!isAnswered}>
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
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
  );
}
