"use client";

import { useEffect, useMemo, useState } from "react";
import { Assessment } from "@/services/lectures/lecture.service";
import { useLectureService } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AssessmentQuestion = NonNullable<Assessment["questions"]>[number];
type AssessmentOption = AssessmentQuestion["options"][number];

const SUPPORTED_QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE"] as const;

type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

function isSupportedQuestionType(type: AssessmentQuestion["type"]): type is SupportedQuestionType {
  return SUPPORTED_QUESTION_TYPES.includes(type as SupportedQuestionType);
}

function isSingleCorrectAnswerQuestion(type: AssessmentQuestion["type"]) {
  return type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE";
}

interface AssessmentEditorProps {
  assessment: Assessment;
  onChanged?: () => Promise<void> | void;
}

export function AssessmentEditor({ assessment, onChanged }: AssessmentEditorProps) {
  const service = useLectureService();
  const { toast } = useToast();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState(assessment.title);
  const [description, setDescription] = useState(assessment.description ?? "");
  const [type, setType] = useState<Assessment["type"]>(assessment.type);
  const [status, setStatus] = useState<Assessment["status"]>(assessment.status);
  const [durationMinutes, setDurationMinutes] = useState<string>(assessment.durationMinutes?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState<string>(assessment.expiresAt ? assessment.expiresAt.slice(0, 16) : "");
  const [allowReview, setAllowReview] = useState(assessment.allowReview);
  const [allowLateSubmission, setAllowLateSubmission] = useState(assessment.allowLateSubmission);
  const [questions, setQuestions] = useState(assessment.questions ?? []);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState("1");
  const [newQuestionType, setNewQuestionType] = useState<AssessmentQuestion["type"] | "MULTIPLE_CHOICE">("MULTIPLE_CHOICE");
  const [newQuestionExplanation, setNewQuestionExplanation] = useState("");

  useEffect(() => {
    setTitle(assessment.title);
    setDescription(assessment.description ?? "");
    setType(assessment.type);
    setStatus(assessment.status);
    setDurationMinutes(assessment.durationMinutes?.toString() ?? "");
    setExpiresAt(assessment.expiresAt ? assessment.expiresAt.slice(0, 16) : "");
    setAllowReview(assessment.allowReview);
    setAllowLateSubmission(assessment.allowLateSubmission);
    setQuestions(assessment.questions ?? []);
  }, [assessment]);

  const questionCount = useMemo(() => questions.length, [questions]);
  const isLoading = (action: string) => loadingAction === action;

  const handleSaveAssessment = async () => {
    setLoadingAction("save-assessment");
    setSaving(true);
    try {
      const updatedAssessment = await service.updateAssessment(assessment.id, {
        title,
        description: description.trim() || null,
        type,
        status,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        allowReview,
        allowLateSubmission,
        totalPoints: assessment.totalPoints,
      });
      setStatus(updatedAssessment.status);
      toast({ title: "Saved", description: "Assessment updated" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to save assessment"), variant: "destructive" });
    } finally {
      setSaving(false);
      setLoadingAction(null);
    }
  };

  const handlePublish = async () => {
    setLoadingAction("publish-assessment");
    setPublishing(true);
    try {
      const updatedAssessment = await service.publishAssessment(assessment.id);
      setStatus(updatedAssessment.status);
      toast({ title: "Published", description: "Assessment is now live" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to publish assessment"), variant: "destructive" });
    } finally {
      setPublishing(false);
      setLoadingAction(null);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) return;

    try {
      setLoadingAction("add-question");
      const created = await service.addAssessmentQuestion(assessment.id, {
        questionText: newQuestionText,
        points: Number(newQuestionPoints) || 1,
        type: newQuestionType,
        explanation: newQuestionExplanation.trim() || null,
      });
      // If it's a multiple choice question, create default options (A-D)
      if (newQuestionType === "MULTIPLE_CHOICE") {
        const defaultOptions = ["Option A", "Option B", "Option C", "Option D"];
        await Promise.all(
          defaultOptions.map((text, idx) =>
            service.addAssessmentOption(created.id, {
              optionText: text,
              order: idx + 1,
              isCorrect: false,
            })
          )
        );
      }

      setNewQuestionText("");
      setNewQuestionPoints("1");
      setNewQuestionExplanation("");
      toast({ title: "Question added", description: "New question added to assessment" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to add question"), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateQuestion = async (
    questionId: string,
    payload: {
      questionText: string;
      points: number;
      explanation: string;
      type: AssessmentQuestion["type"];
      options: Array<{ id: string; optionText: string; isCorrect: boolean; order: number }>;
    }
  ) => {
    try {
      setLoadingAction(`question-save-${questionId}`);
      const updated = await service.updateAssessmentQuestion(questionId, {
        questionText: payload.questionText,
        points: payload.points,
        explanation: payload.explanation.trim() || undefined,
        type: payload.type,
        options: payload.options,
      });
      setQuestions((prev) => prev.map((question) => (question.id === questionId ? updated : question)));
      toast({ title: "Question saved", description: "Question updated" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to update question"), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setLoadingAction(`question-delete-${questionId}`);
      await service.deleteAssessmentQuestion(questionId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
      toast({ title: "Question deleted", description: "Question removed from assessment" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to delete question"), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };
  const handleAddOption = async (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    try {
      setLoadingAction(`option-add-${questionId}`);
      const created = await service.addAssessmentOption(questionId, {
        optionText: `Option ${question.options.length + 1}`,
        order: question.options.length + 1,
        isCorrect: false,
      });
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId ? { ...item, options: [...item.options, created] } : item
        )
      );
      toast({ title: "Option added", description: "Added a new answer option" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to add option"), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteOption = async (questionId: string, optionId: string) => {
    try {
      setLoadingAction(`option-delete-${optionId}`);
      await service.deleteAssessmentOption(optionId);
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, options: question.options.filter((option) => option.id !== optionId) }
            : question
        )
      );
      toast({ title: "Option deleted", description: "Option removed" });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to delete option"), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 border border-white/10 bg-white/5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Assessment editor</h3>
            <p className="text-sm text-slate-400">{questionCount} questions · {assessment.totalPoints} points</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSaveAssessment} disabled={saving || isLoading("save-assessment")} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              {isLoading("save-assessment") ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button type="button" onClick={handlePublish} disabled={publishing || isLoading("publish-assessment")} variant="outline" className="border-white/10 text-slate-200">
              {isLoading("publish-assessment") ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`assessment-title-${assessment.id}`}>Title</Label>
            <input
              id={`assessment-title-${assessment.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assessment-type-${assessment.id}`}>Type</Label>
            <select
              id={`assessment-type-${assessment.id}`}
              value={type}
              onChange={(event) => setType(event.target.value as Assessment["type"])}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="QUIZ">QUIZ</option>
              <option value="ASSIGNMENT">ASSIGNMENT</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`assessment-description-${assessment.id}`}>Description</Label>
            <textarea
              id={`assessment-description-${assessment.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assessment-duration-${assessment.id}`}>Duration minutes</Label>
            <input
              id={`assessment-duration-${assessment.id}`}
              type="number"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assessment-expires-${assessment.id}`}>Deadline</Label>
            <input
              id={`assessment-expires-${assessment.id}`}
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={allowReview} onChange={(event) => setAllowReview(event.target.checked)} />
            Allow review
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={allowLateSubmission} onChange={(event) => setAllowLateSubmission(event.target.checked)} />
            Allow late submission
          </label>
        </div>
      </Card>

      <Card className="p-5 border border-white/10 bg-white/5 rounded-2xl space-y-4">
        <h4 className="text-base font-semibold text-white">Add question</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Question text</Label>
            <textarea
              value={newQuestionText}
              onChange={(event) => setNewQuestionText(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label>Points</Label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={newQuestionPoints}
              onChange={(event) => setNewQuestionPoints(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={newQuestionType}
              onChange={(event) => setNewQuestionType(event.target.value as AssessmentQuestion["type"])}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              {SUPPORTED_QUESTION_TYPES.map((questionType) => (
                <option key={questionType} value={questionType}>
                  {questionType}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Explanation</Label>
            <textarea
              value={newQuestionExplanation}
              onChange={(event) => setNewQuestionExplanation(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        <Button type="button" onClick={handleAddQuestion} disabled={isLoading("add-question")} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isLoading("add-question") ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add question"
          )}
        </Button>
      </Card>

      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionEditor
            key={question.id}
            question={question}
            onSave={handleUpdateQuestion}
            onDelete={handleDeleteQuestion}
            onAddOption={handleAddOption}
            onDeleteOption={handleDeleteOption}
            loadingAction={loadingAction}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  onSave,
  onDelete,
  onAddOption,
  onDeleteOption,
  loadingAction,
}: {
  question: AssessmentQuestion;
  onSave: (
    questionId: string,
    payload: {
      questionText: string;
      points: number;
      explanation: string;
      type: AssessmentQuestion["type"];
      options: Array<{ id: string; optionText: string; isCorrect: boolean; order: number }>;
    }
  ) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onAddOption: (questionId: string) => Promise<void>;
  onDeleteOption: (questionId: string, optionId: string) => Promise<void>;
  loadingAction: string | null;
}) {
  const [questionText, setQuestionText] = useState(question.questionText);
  const [points, setPoints] = useState(question.points.toString());
  const [type, setType] = useState(question.type);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [options, setOptions] = useState(question.options);

  useEffect(() => {
    setQuestionText(question.questionText);
    setPoints(question.points.toString());
    setType(question.type);
    setExplanation(question.explanation ?? "");
    setOptions(question.options);
  }, [question]);

  const handleOptionTextChange = (optionId: string, optionText: string) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === optionId ? { ...option, optionText } : option))
    );
  };

  const handleOptionCorrectChange = (optionId: string, isCorrect: boolean) => {
    setOptions((prev) => {
      const shouldKeepOnlyOneCorrect = isCorrect && isSingleCorrectAnswerQuestion(type);

      return prev.map((option) => {
        if (option.id === optionId) {
          return { ...option, isCorrect };
        }

        if (shouldKeepOnlyOneCorrect) {
          return { ...option, isCorrect: false };
        }

        return option;
      });
    });
  };

  return (
    <Card className="p-5 border border-white/10 bg-white/5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h5 className="text-white font-semibold">Question {question.order}</h5>
          <p className="text-sm text-slate-400">{question.options.length} options</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-slate-200"
            disabled={loadingAction === `question-save-${question.id}`}
            onClick={() =>
              onSave(question.id, {
                questionText,
                points: Number(points) || 0,
                explanation,
                type,
                options: options.map((option) => ({
                  id: option.id,
                  optionText: option.optionText,
                  isCorrect: option.isCorrect,
                  order: option.order,
                })),
              })
            }
          >
            {loadingAction === `question-save-${question.id}` ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-slate-200"
            disabled={loadingAction === `question-delete-${question.id}`}
            onClick={() => onDelete(question.id)}
          >
            {loadingAction === `question-delete-${question.id}` ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Question text</Label>
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            className="min-h-20 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <Label>Points</Label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          {isSupportedQuestionType(type) ? (
            <select
              value={type}
              onChange={(event) => setType(event.target.value as AssessmentQuestion["type"])}
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              {SUPPORTED_QUESTION_TYPES.map((questionType) => (
                <option key={questionType} value={questionType}>
                  {questionType}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
              Unsupported type in FE
            </div>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Explanation</Label>
          <textarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            className="min-h-20 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h6 className="text-sm font-semibold text-slate-300">Options</h6>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-slate-200"
            disabled={loadingAction === `option-add-${question.id}`}
            onClick={() => onAddOption(question.id)}
          >
            {loadingAction === `option-add-${question.id}` ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add option"
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <OptionEditor
              key={option.id}
              questionId={question.id}
              questionType={type}
              option={option}
              onDeleteOption={onDeleteOption}
              onSetOptionCorrect={handleOptionCorrectChange}
              onUpdateOptionText={handleOptionTextChange}
              loadingAction={loadingAction}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function OptionEditor({
  questionId,
  questionType,
  option,
  onDeleteOption,
  onSetOptionCorrect,
  onUpdateOptionText,
  loadingAction,
}: {
  questionId: string;
  questionType: AssessmentQuestion["type"];
  option: AssessmentOption;
  onDeleteOption: (questionId: string, optionId: string) => Promise<void>;
  onSetOptionCorrect: (optionId: string, isCorrect: boolean) => void;
  onUpdateOptionText: (optionId: string, optionText: string) => void;
  loadingAction: string | null;
}) {
  const isSingleCorrectAnswer = isSingleCorrectAnswerQuestion(questionType);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg border border-white/10 bg-slate-950/30 p-3">
      <input
        value={option.optionText}
        onChange={(event) => onUpdateOptionText(option.id, event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
      />
      <label className="flex items-center gap-2 text-sm text-slate-200 justify-self-start md:justify-self-center">
        <input
          type={isSingleCorrectAnswer ? "radio" : "checkbox"}
          name={isSingleCorrectAnswer ? `correct-option-${questionId}` : undefined}
          checked={option.isCorrect}
          onChange={(event) => onSetOptionCorrect(option.id, event.target.checked)}
        />
        {isSingleCorrectAnswer ? "Correct answer" : "Correct"}
      </label>
      <Button
        type="button"
        variant="outline"
        className="border-white/10 text-slate-200"
        disabled={loadingAction === `option-delete-${option.id}`}
        onClick={() => onDeleteOption(questionId, option.id)}
      >
        {loadingAction === `option-delete-${option.id}` ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          "Delete"
        )}
      </Button>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
