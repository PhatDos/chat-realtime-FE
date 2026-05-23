"use client";

import { SummaryGenerator } from "@/components/lectures/generators/summary-generator";
import { FlashcardGenerator } from "@/components/lectures/generators/flashcard-generator";
import { QuizGenerator } from "@/components/lectures/generators/quiz-generator";
import type { LectureFileRow } from "@/services/lectures/lecture.service";
import type { Lecture } from "@/services/lectures/lecture.service";
import { SummaryTone } from "@/types/lecture";
import { FileText } from "lucide-react";

interface LectureOverviewSectionProps {
  lecture: Lecture;
  lectureFiles: LectureFileRow[];
  loadingLectureFiles: boolean;
  isOwner: boolean;
  hasSummary: boolean;
  hasFlashcards: boolean;
  hasQuiz: boolean;
  generating: Record<string, boolean>;
  onGenerateSummary: (tone: SummaryTone) => Promise<void>;
  onGenerateFlashcards: (count: number) => Promise<void>;
  onGenerateQuiz: (questionCount: number) => Promise<void | unknown>;
}

export function LectureOverviewSection({
  lecture,
  lectureFiles,
  loadingLectureFiles,
  isOwner,
  hasSummary,
  hasFlashcards,
  hasQuiz,
  generating,
  onGenerateSummary,
  onGenerateFlashcards,
  onGenerateQuiz,
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <QuizGenerator
              lectureId={lecture.id}
              onGenerate={onGenerateQuiz}
              isGenerating={generating.quiz || false}
              alreadyGenerated={hasQuiz}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300">
          Student mode is view-only. Use the Summary, Flashcards, or Quiz tabs to review generated content and attempts.
        </div>
      )}
    </div>
  );
}