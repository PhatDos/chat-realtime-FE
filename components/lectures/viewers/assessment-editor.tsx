"use client";

import { useEffect, useMemo, useState } from "react";
import { Assessment } from "@/services/lectures/lecture.service";
import { useLectureService } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AssessmentQuestion = NonNullable<Assessment["questions"]>[number];
type AssessmentOption = AssessmentQuestion["options"][number];

interface AssessmentEditorProps {
  assessment: Assessment;
  onChanged?: () => Promise<void> | void;
}

export function AssessmentEditor({ assessment, onChanged }: AssessmentEditorProps) {
  const service = useLectureService();
  const { toast } = useToast();

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

  const refreshLocalAssessment = async () => {
    if (onChanged) {
      await onChanged();
    }
  };

  const handleSaveAssessment = async () => {
    setSaving(true);
    try {
      await service.updateAssessment(assessment.id, {
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
      toast({ title: "Saved", description: "Assessment updated" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to save assessment"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await service.publishAssessment(assessment.id);
      toast({ title: "Published", description: "Assessment is now live" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to publish assessment"), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) return;

    try {
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
      // Refresh local data (will include newly created options)
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to add question"), variant: "destructive" });
    }
  };

  const handleUpdateQuestion = async (
    questionId: string,
    payload: { questionText: string; points: number; explanation: string; type: AssessmentQuestion["type"] }
  ) => {
    try {
      const updated = await service.updateAssessmentQuestion(questionId, {
        questionText: payload.questionText,
        points: payload.points,
        explanation: payload.explanation.trim() || undefined,
        type: payload.type,
      });
      setQuestions((prev) => prev.map((question) => (question.id === questionId ? updated : question)));
      toast({ title: "Question saved", description: "Question updated" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to update question"), variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await service.deleteAssessmentQuestion(questionId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
      toast({ title: "Question deleted", description: "Question removed from assessment" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to delete question"), variant: "destructive" });
    }
  };

  const handleUpdateOptionText = async (questionId: string, optionId: string, optionText: string, isCorrect: boolean, order: number) => {
    try {
      const updated = await service.updateAssessmentOption(optionId, { optionText, isCorrect, order });
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? {
                ...question,
                options: question.options.map((option) => (option.id === optionId ? updated : option)),
              }
            : question
        )
      );
      toast({ title: "Option saved", description: "Option text updated" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to update option"), variant: "destructive" });
    }
  };

  const handleAddOption = async (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    try {
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
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to add option"), variant: "destructive" });
    }
  };

  const handleDeleteOption = async (questionId: string, optionId: string) => {
    try {
      await service.deleteAssessmentOption(optionId);
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, options: question.options.filter((option) => option.id !== optionId) }
            : question
        )
      );
      toast({ title: "Option deleted", description: "Option removed" });
      await refreshLocalAssessment();
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to delete option"), variant: "destructive" });
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
            <Button onClick={handleSaveAssessment} disabled={saving} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handlePublish} disabled={publishing} variant="outline" className="border-white/10 text-slate-200">
              {publishing ? "Publishing..." : "Publish"}
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
              <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
              <option value="MULTI_SELECT">MULTI_SELECT</option>
              <option value="TRUE_FALSE">TRUE_FALSE</option>
              <option value="ESSAY">ESSAY</option>
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
        <Button onClick={handleAddQuestion} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          Add question
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
            onUpdateOptionText={handleUpdateOptionText}
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
  onUpdateOptionText,
}: {
  question: AssessmentQuestion;
  onSave: (
    questionId: string,
    payload: { questionText: string; points: number; explanation: string; type: AssessmentQuestion["type"] }
  ) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onAddOption: (questionId: string) => Promise<void>;
  onDeleteOption: (questionId: string, optionId: string) => Promise<void>;
  onUpdateOptionText: (
    questionId: string,
    optionId: string,
    optionText: string,
    isCorrect: boolean,
    order: number
  ) => Promise<void>;
}) {
  const [questionText, setQuestionText] = useState(question.questionText);
  const [points, setPoints] = useState(question.points.toString());
  const [type, setType] = useState(question.type);
  const [explanation, setExplanation] = useState(question.explanation ?? "");

  useEffect(() => {
    setQuestionText(question.questionText);
    setPoints(question.points.toString());
    setType(question.type);
    setExplanation(question.explanation ?? "");
  }, [question]);

  return (
    <Card className="p-5 border border-white/10 bg-white/5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h5 className="text-white font-semibold">Question {question.order}</h5>
          <p className="text-sm text-slate-400">{question.options.length} options</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/10 text-slate-200"
            onClick={() => onSave(question.id, { questionText, points: Number(points) || 0, explanation, type })}
          >
            Save
          </Button>
          <Button
            variant="outline"
            className="border-white/10 text-slate-200"
            onClick={() => onDelete(question.id)}
          >
            Delete
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
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AssessmentQuestion["type"])}
            className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          >
            <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
            <option value="MULTI_SELECT">MULTI_SELECT</option>
            <option value="TRUE_FALSE">TRUE_FALSE</option>
            <option value="ESSAY">ESSAY</option>
          </select>
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
            variant="outline"
            className="border-white/10 text-slate-200"
            onClick={() => onAddOption(question.id)}
          >
            Add option
          </Button>
        </div>

        <div className="space-y-2">
          {question.options.map((option) => (
            <OptionEditor
              key={option.id}
              questionId={question.id}
              option={option}
              onDeleteOption={onDeleteOption}
              onUpdateOptionText={onUpdateOptionText}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function OptionEditor({
  questionId,
  option,
  onDeleteOption,
  onUpdateOptionText,
}: {
  questionId: string;
  option: AssessmentOption;
  onDeleteOption: (questionId: string, optionId: string) => Promise<void>;
  onUpdateOptionText: (
    questionId: string,
    optionId: string,
    optionText: string,
    isCorrect: boolean,
    order: number
  ) => Promise<void>;
}) {
  const [optionText, setOptionText] = useState(option.optionText);
  const [isCorrect, setIsCorrect] = useState(option.isCorrect);

  useEffect(() => {
    setOptionText(option.optionText);
    setIsCorrect(option.isCorrect);
  }, [option]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-lg border border-white/10 bg-slate-950/30 p-3">
      <input
        value={optionText}
        onChange={(event) => setOptionText(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
      />
      <label className="flex items-center gap-2 text-sm text-slate-200 justify-self-start md:justify-self-center">
        <input
          type="checkbox"
          checked={isCorrect}
          onChange={(event) => setIsCorrect(event.target.checked)}
        />
        Correct
      </label>
      <Button
        variant="outline"
        className="border-white/10 text-slate-200"
        onClick={() => onUpdateOptionText(questionId, option.id, optionText, isCorrect, option.order)}
      >
        Save
      </Button>
      <Button
        variant="outline"
        className="border-white/10 text-slate-200"
        onClick={() => onDeleteOption(questionId, option.id)}
      >
        Delete
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
