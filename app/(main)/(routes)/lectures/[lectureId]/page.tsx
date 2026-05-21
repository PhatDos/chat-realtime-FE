"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { SummaryGenerator } from "@/components/lectures/generators/summary-generator";
import { FlashcardGenerator } from "@/components/lectures/generators/flashcard-generator";
import { QuizGenerator } from "@/components/lectures/generators/quiz-generator";
import { SummaryViewer } from "@/components/lectures/viewers/summary-viewer";
import { FlashcardViewer } from "@/components/lectures/viewers/flashcard-viewer";
import { QuizTaker } from "@/components/lectures/viewers/quiz-taker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Sparkles, BookOpen, CalendarDays, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LectureDetailPage() {
  const { lectureId } = useParams();
  const searchParams = useSearchParams();
  const { lecture, loading, generating, fetchLecture, generateSummary, generateFlashcards, generateQuiz } =
    useLectureData(lectureId as string);
  const [activeTab, setActiveTab] = useState("overview");

  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const backHref =
    serverId && channelId
      ? `/lectures?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
      : "/lectures";

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-slate-300">Lecture not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link href={backHref}>
            <Button
              variant="ghost"
              size="sm"
              className="group border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to lectures
            </Button>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
            <Sparkles className="h-4 w-4" />
            Lecture details
          </div>
        </div>

        {/* Lecture Info */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">{lecture.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              Uploaded {new Date(lecture.createdAt).toLocaleString()}
            </span>
            {lecture.member && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-cyan-400" />
                {lecture.member?.profile?.name ?? "Unknown"}
              </span>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4">
                <TabsList className="grid w-full grid-cols-4 bg-transparent gap-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="summary"
                    className="rounded-none border-b-2 border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    Summary
                  </TabsTrigger>
                  <TabsTrigger
                    value="flashcards"
                    className="rounded-none border-b-2 border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    Flashcards
                  </TabsTrigger>
                  <TabsTrigger
                    value="quiz"
                    className="rounded-none border-b-2 border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    Quiz
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 py-6">
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Generate Learning Materials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SummaryGenerator
                        lectureId={lecture.id}
                        onGenerate={generateSummary}
                        isGenerating={generating.summary || false}
                      />
                      <FlashcardGenerator
                        lectureId={lecture.id}
                        onGenerate={generateFlashcards}
                        isGenerating={generating.flashcards || false}
                      />
                      <QuizGenerator
                        lectureId={lecture.id}
                        onGenerate={generateQuiz}
                        isGenerating={generating.quiz || false}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4 mt-0">
                  {lecture.summaries && lecture.summaries.length > 0 ? (
                    <div className="space-y-4">
                      {lecture.summaries.map((summary) => (
                        <SummaryViewer key={summary.id} summary={summary} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No summaries generated yet. Generate one from Overview tab.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flashcards" className="space-y-4 mt-0">
                  {lecture.flashcards && lecture.flashcards.length > 0 ? (
                    <FlashcardViewer flashcards={lecture.flashcards} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No flashcards generated yet. Generate some from Overview tab.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quiz" className="space-y-4 mt-0">
                  {lecture.quizzes && lecture.quizzes.length > 0 ? (
                    <div className="space-y-4">
                      {lecture.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] p-6 transition-all duration-200 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-950/20"
                        >
                          <h3 className="text-xl font-semibold text-white mb-4">{quiz.title}</h3>
                          <QuizTaker
                            quiz={quiz}
                            onSubmit={async (answers) => {
                              console.log("Quiz submitted:", answers);
                            }}
                            isSubmitting={false}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No quizzes generated yet. Generate one from Overview tab.</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
