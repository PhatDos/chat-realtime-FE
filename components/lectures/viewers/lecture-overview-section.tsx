"use client";

import { SummaryGenerator } from "@/components/lectures/generators/summary-generator";
import { FlashcardGenerator } from "@/components/lectures/generators/flashcard-generator";
import { QuizGenerator } from "@/components/lectures/generators/quiz-generator";
import type { LectureFileRow } from "@/services/lectures/lecture.service";
import type { Lecture } from "@/services/lectures/lecture.service";
import { SummaryTone } from "@/types/lecture";
import { CalendarDays, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LectureOverviewSectionProps {
  lecture: Lecture;
  lectureFiles: LectureFileRow[];
  loadingLectureFiles: boolean;
  isOwner: boolean;
  isStudentView: boolean;
  hasSummary: boolean;
  hasFlashcards: boolean;
  hasQuiz: boolean;
  generating: Record<string, boolean>;
  onGenerateSummary: (tone: SummaryTone) => Promise<void>;
  onGenerateFlashcards: (count: number) => Promise<void>;
  onGenerateQuiz: (questionCount: number) => Promise<void | unknown>;
  onQuizAction?: () => void;
  quizActionLabel?: string;
}

export function LectureOverviewSection({
  lecture,
  lectureFiles,
  loadingLectureFiles,
  isOwner,
  isStudentView,
  hasSummary,
  hasFlashcards,
  hasQuiz,
  generating,
  onGenerateSummary,
  onGenerateFlashcards,
  onGenerateQuiz,
  onQuizAction,
  quizActionLabel = "Do quiz",
}: LectureOverviewSectionProps) {
  return (
    <div className="space-y-6 mt-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Uploaded lecture file</h2>
          <div className="text-sm text-slate-400">Source file used to generate the lecture materials.</div>
        </div>

        {loadingLectureFiles ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
            Loading uploaded file...
          </div>
        ) : lectureFiles.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full table-fixed text-center text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium text-center">Title</th>
                  <th className="px-4 py-3 font-medium text-center">Type</th>
                  <th className="px-4 py-3 font-medium text-center">Uploaded by</th>
                  <th className="px-4 py-3 font-medium text-center">Uploaded at</th>
                  <th className="px-4 py-3 font-medium text-center">File</th>
                </tr>
              </thead>
              <tbody>
                {lectureFiles.map((file) => (
                  <tr key={file.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-center align-middle text-white">{file.title}</td>
                    <td className="px-4 py-3 text-center align-middle text-slate-300">{file.fileType}</td>
                    <td className="px-4 py-3 text-center align-middle text-slate-300">{file.uploadedBy}</td>
                    <td className="px-4 py-3 text-center align-middle text-slate-300">{new Date(file.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center align-middle">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        Open file
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            No uploaded file found for this lecture.
          </div>
        )}
      </div>

      {isOwner ? (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-white">Generate Learning Materials</h2>
            <div className="text-sm text-slate-400">Owner tools for generating summary, flashcards, and quiz.</div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <QuizGenerator
                lectureId={lecture.id}
                onGenerate={onGenerateQuiz}
                isGenerating={generating.quiz || false}
                alreadyGenerated={hasQuiz}
              />
            </div>

            <SummaryGenerator
              lectureId={lecture.id}
              onGenerate={onGenerateSummary}
              isGenerating={generating.summary || false}
              alreadyGenerated={hasSummary}
            />

            <FlashcardGenerator
              lectureId={lecture.id}
              onGenerate={onGenerateFlashcards}
              isGenerating={generating.flashcards || false}
              alreadyGenerated={hasFlashcards}
            />
          </div>
        </div>
      ) : isStudentView ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300 space-y-4">
          <p>Student mode is view-only. Summary and flashcards are available here.</p>
          {hasQuiz ? (
            <Card className="border border-white/10 bg-slate-950/40 rounded-2xl p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{lecture.quiz?.title ?? "Quiz"}</h3>
                    <p className="text-sm text-slate-400">
                      {lecture.quiz?.type ?? "QUIZ"} · {lecture.quiz?.status ?? "PUBLISHED"} · {lecture.quiz?.totalQuestions ?? 0} questions
                    </p>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    Ready
                  </div>
                </div>

                {lecture.quiz?.description ? (
                  <p className="text-sm text-slate-300">{lecture.quiz.description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Deadline</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <CalendarDays className="h-4 w-4 text-cyan-400" />
                    {lecture.quiz?.expiresAt ? new Date(lecture.quiz.expiresAt).toLocaleString() : "No deadline"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Duration</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <Clock3 className="h-4 w-4 text-cyan-400" />
                    {lecture.quiz?.durationMinutes ? `${lecture.quiz.durationMinutes} minutes` : "No time limit"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Late submission</div>
                  <div className="mt-1 text-sm text-slate-200">
                    {lecture.quiz?.allowLateSubmission ? "Allowed by owner" : "Not allowed"}
                  </div>
                </div>
              </div>

              {onQuizAction ? (
                <Button type="button" onClick={onQuizAction} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  {quizActionLabel}
                </Button>
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300">
          Student mode is view-only. Use the Summary and Flashcards tabs here, then open the quiz from this section when available.
        </div>
      )}
    </div>
  );
}