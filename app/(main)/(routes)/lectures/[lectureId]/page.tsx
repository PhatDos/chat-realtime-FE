"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { useLectureService } from "@/services/lectures/lecture.service";
import type { Assessment, Quiz } from "@/services/lectures/lecture.service";
import { SummaryGenerator } from "@/components/lectures/generators/summary-generator";
import { FlashcardGenerator } from "@/components/lectures/generators/flashcard-generator";
import { QuizGenerator } from "@/components/lectures/generators/quiz-generator";
import { AssessmentEditor } from "@/components/lectures/viewers/assessment-editor";
import { SummaryViewer } from "@/components/lectures/viewers/summary-viewer";
import { FlashcardViewer } from "@/components/lectures/viewers/flashcard-viewer";
import { QuizTaker } from "@/components/lectures/viewers/quiz-taker";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Sparkles, BookOpen, CalendarDays, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerSidebarQuery } from "@/hooks/use-server-sidebar-query";

export default function LectureDetailPage() {
  const { lectureId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureService = useLectureService();
  const { lecture, loading, generating, fetchLecture, generateSummary, generateFlashcards, generateQuiz } =
    useLectureData(lectureId as string);
  const hasSummary = Boolean(lecture?.summary);
  const hasFlashcards = Boolean(lecture?.flashcardSet?.flashcards?.length);
  const hasQuiz = Boolean(lecture?.assessment);
  const [activeTab, setActiveTab] = useState("overview");
  const [submittingAssessmentId, setSubmittingAssessmentId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const { data: serverSidebarData } = useServerSidebarQuery({
    serverId,
    enabled: Boolean(serverId),
  });
  const backHref =
    serverId && channelId
      ? `/lectures?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
      : "/lectures";
  const channelName = serverSidebarData?.server.channels.find((channel) => channel.id === channelId)?.name;
  const assessments = lecture?.assessment ? [lecture.assessment as Assessment] : [];

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  const handleBackClick = () => {
    setIsNavigating(true);
    router.push(backHref);
  };

  const handleEditAssessmentClick = (assessmentId: string) => {
    setIsNavigating(true);
    router.push(
      `/lectures/${lectureId as string}/assessment-editor?assessmentId=${assessmentId}&serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
    );
  };

  const handleGenerateQuiz = async (questionCount: number) => {
    const generatedAssessment = await generateQuiz(questionCount);

    if (generatedAssessment?.id) {
      handleEditAssessmentClick(generatedAssessment.id);
    }
  };

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
      <LoadingOverlay isLoading={isNavigating} text="Navigating..." />
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handleBackClick}
            disabled={isNavigating}
            variant="ghost"
            size="sm"
            className="group border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to lectures
          </Button>

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
            {channelName && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                {channelName}
              </span>
            )}
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
                    className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="summary"
                    className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    Summary
                  </TabsTrigger>
                  <TabsTrigger
                    value="flashcards"
                    className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    Flashcards
                  </TabsTrigger>
                  <TabsTrigger
                    value="quiz"
                    className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
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
                        alreadyGenerated={hasSummary}
                      />
                      <FlashcardGenerator
                        lectureId={lecture.id}
                        onGenerate={generateFlashcards}
                        isGenerating={generating.flashcards || false}
                        alreadyGenerated={hasFlashcards}
                      />
                      <QuizGenerator
                        lectureId={lecture.id}
                        onGenerate={handleGenerateQuiz}
                        isGenerating={generating.quiz || false}
                        alreadyGenerated={hasQuiz}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4 mt-0">
                  {lecture.summary ? (
                    <SummaryViewer summary={lecture.summary} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No summaries generated yet. Generate one from Overview tab.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flashcards" className="space-y-4 mt-0">
                  {lecture.flashcardSet?.flashcards && lecture.flashcardSet.flashcards.length > 0 ? (
                    <FlashcardViewer flashcards={lecture.flashcardSet.flashcards} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No flashcards generated yet. Generate some from Overview tab.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quiz" className="space-y-4 mt-0">
                  {assessments.length > 0 ? (
                    <div className="space-y-4">
                      {assessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] p-6 transition-all duration-200 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-950/20"
                        >
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-white">{assessment.title}</h3>
                              <p className="text-sm text-slate-400">
                                {assessment.type} · {assessment.status} · {assessment.totalQuestions} questions
                              </p>
                            </div>
                            {assessment.status === "DRAFT" && (
                              <Button
                                size="sm"
                                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                onClick={async () => {
                                  setSubmittingAssessmentId(assessment.id);
                                  try {
                                    await lectureService.publishAssessment(assessment.id);
                                    await fetchLecture();
                                  } finally {
                                    setSubmittingAssessmentId(null);
                                  }
                                }}
                                disabled={submittingAssessmentId === assessment.id}
                              >
                                {submittingAssessmentId === assessment.id ? "Publishing..." : "Publish"}
                              </Button>
                            )}
                          </div>
                          {assessment.status === "DRAFT" && (
                            <div className="mb-2">
                              <Button
                                size="sm"
                                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                onClick={() => handleEditAssessmentClick(assessment.id)}
                                disabled={isNavigating}
                              >
                                Edit assessment
                              </Button>
                            </div>
                          )}
                          <QuizTaker
                            quiz={assessment as Quiz}
                            onSubmit={async (answers) => {
                              return await lectureService.submitAssessmentAttempt(assessment.id, memberId, answers);
                            }}
                            onSubmitted={(response) => {
                              router.push(
                                `/lectures/${lectureId as string}/assessment-attempts/${response.attempt.id}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
                              );
                            }}
                            isSubmitting={false}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                      <p className="text-slate-300">No assessments generated yet. Generate one from Overview tab.</p>
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
