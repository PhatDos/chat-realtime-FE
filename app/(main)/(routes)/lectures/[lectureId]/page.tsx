"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { useLectureService, type LectureFileRow } from "@/services/lectures/lecture.service";
import type {
  Assessment,
  AssessmentAttempt,
  Quiz,
  SubmitAssessmentAttemptResponse,
} from "@/services/lectures/lecture.service";
import { AssessmentEditor } from "@/components/lectures/viewers/assessment-editor";
import { SummaryViewer } from "@/components/lectures/viewers/summary-viewer";
import { FlashcardViewer } from "@/components/lectures/viewers/flashcard-viewer";
import { QuizTaker } from "@/components/lectures/viewers/quiz-taker";
import { LectureOverviewSection } from "@/components/lectures/viewers/lecture-overview-section";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Sparkles, BookOpen, CalendarDays, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerSidebarQuery } from "@/hooks/use-server-sidebar-query";
import { useToast } from "@/hooks/use-toast";

export default function LectureDetailPage() {
  const { lectureId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureService = useLectureService();
  const { toast } = useToast();
  const { lecture, loading, generating, fetchLecture, generateSummary, generateFlashcards, generateQuiz } =
    useLectureData(lectureId as string);
  const [lectureFiles, setLectureFiles] = useState<LectureFileRow[]>([]);
  const [loadingLectureFiles, setLoadingLectureFiles] = useState(false);
  const hasSummary = Boolean(lecture?.summary);
  const hasFlashcards = Boolean(lecture?.flashcardSet?.flashcards?.length);
  const hasQuiz = Boolean(lecture?.assessment);

  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const viewMode = searchParams.get("view") ?? "";
  const isOwner = lecture?.memberId === memberId;
  const isStudentView = viewMode === "student" && !isOwner;
  const availableTabs = isOwner ? ["overview", "summary", "flashcards", "edit-quiz"] : ["overview", "summary", "flashcards", "quiz"];
  const defaultTab = viewMode === "student" && !isOwner ? "quiz" : searchParams.get("tab") ?? "overview";
  const [activeTab, setActiveTab] = useState(availableTabs.includes(defaultTab) ? defaultTab : availableTabs[0]);
  const [submittingAssessmentId, setSubmittingAssessmentId] = useState<string | null>(null);
  const [isSubmittingAssessmentAttempt, setIsSubmittingAssessmentAttempt] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data: serverSidebarData } = useServerSidebarQuery({
    serverId,
    enabled: Boolean(serverId),
  });
  const backHref =
    serverId && channelId
      ? `/lectures?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}${isStudentView ? "&view=student" : ""}`
      : "/lectures";
  const channelName = serverSidebarData?.server.channels.find((channel) => channel.id === channelId)?.name;
  const assessments = lecture?.assessment ? [lecture.assessment as Assessment] : [];
  const currentAssessment = assessments[0] ?? null;
  const currentAttempt = useMemo(() => {
    if (!currentAssessment || !memberId) {
      return null;
    }

    return (
      currentAssessment.attempts?.find(
        (attempt) => attempt.memberId === memberId && Boolean(attempt.submittedAt)
      ) ?? null
    );
  }, [currentAssessment, memberId]);

  const getAttemptHref = (attemptId: string) =>
    `/lectures/${lectureId as string}/assessment-attempts/${attemptId}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`;

  const getLectureHref = (tab: string) =>
    `/lectures/${lectureId as string}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}&tab=${encodeURIComponent(tab)}`;

  const buildSubmitResponse = (attempt: AssessmentAttempt): SubmitAssessmentAttemptResponse => {
    const totalQuestions = attempt.assessment?.totalQuestions ?? attempt.answers?.length ?? 0;
    const correctCount = attempt.answers?.reduce(
      (count, answer) => count + (answer.isCorrect ? 1 : 0),
      0
    );
    const finalScore = attempt.finalScore;
    const score = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;

    return {
      success: true,
      attempt,
      score,
      correctCount: correctCount ?? 0,
      totalQuestions,
      totalPoints: attempt.assessment?.totalPoints,
      finalScore,
    };
  };

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture, lectureId]);

  useEffect(() => {
    if (!lectureId) return;

    const loadLectureFiles = async () => {
      setLoadingLectureFiles(true);

      try {
        const data = await lectureService.getLectureFiles(lectureId as string);
        setLectureFiles(data);
      } catch (error) {
        console.error("Failed to load lecture files", error);
      } finally {
        setLoadingLectureFiles(false);
      }
    };

    void loadLectureFiles();
  }, [lectureId, lectureService]);

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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {isOwner ? "Owner / teacher view" : "Student / member view"}
            </span>
            {viewMode === "student" && !isOwner && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                View-only mode
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
                    value={isOwner ? "edit-quiz" : "quiz"}
                    className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                  >
                    {isOwner ? "Edit Quiz" : "Quiz"}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 py-6">
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <LectureOverviewSection
                    lecture={lecture}
                    lectureFiles={lectureFiles}
                    loadingLectureFiles={loadingLectureFiles}
                    isOwner={isOwner}
                    hasSummary={hasSummary}
                    hasFlashcards={hasFlashcards}
                    hasQuiz={hasQuiz}
                    generating={generating}
                    onGenerateSummary={generateSummary}
                    onGenerateFlashcards={generateFlashcards}
                    onGenerateQuiz={handleGenerateQuiz}
                  />
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

                {isOwner ? (
                  <TabsContent value="edit-quiz" className="space-y-4 mt-0">
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
                            <div className="mb-2 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                onClick={() => handleEditAssessmentClick(assessment.id)}
                                disabled={isNavigating}
                              >
                                Edit assessment
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                        <p className="text-slate-300">No assessments generated yet. Generate one from Overview tab.</p>
                      </div>
                    )}
                  </TabsContent>
                ) : (
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
                            </div>

                            {currentAttempt ? (
                              <Card className="border border-emerald-400/20 bg-emerald-400/5 p-6 rounded-2xl space-y-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-emerald-200">You already submitted this quiz</p>
                                  <p className="text-sm text-slate-300">
                                    Submitted at {currentAttempt.submittedAt ? new Date(currentAttempt.submittedAt).toLocaleString() : "-"}
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    Final score: {currentAttempt.finalScore.toFixed(1)}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                  onClick={() => router.push(getAttemptHref(currentAttempt.id))}
                                >
                                  View attempt
                                </Button>
                              </Card>
                            ) : (
                              <QuizTaker
                                quiz={assessment as Quiz}
                                onSubmit={async (answers) => {
                                  setIsSubmittingAssessmentAttempt(true);

                                  try {
                                    return await lectureService.submitAssessmentAttempt(assessment.id, memberId, answers);
                                  } catch (error) {
                                    if (isAxiosError(error) && error.response?.status === 409) {
                                      const refreshedLecture = await lectureService.getLectureById(lectureId as string);
                                      const refreshedAttempt = refreshedLecture.assessment?.attempts?.find(
                                        (attempt) => attempt.memberId === memberId && Boolean(attempt.submittedAt)
                                      );

                                      if (refreshedAttempt) {
                                        toast({
                                          title: "Already submitted",
                                          description: "You have already completed this quiz. Opening your attempt.",
                                        });
                                        return buildSubmitResponse(refreshedAttempt);
                                      }
                                    }

                                    throw error;
                                  } finally {
                                    setIsSubmittingAssessmentAttempt(false);
                                  }
                                }}
                                onSubmitted={(response) => {
                                  router.push(getAttemptHref(response.attempt.id));
                                }}
                                isSubmitting={isSubmittingAssessmentAttempt}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                        <p className="text-slate-300">No assessments generated yet. Generate one from Overview tab.</p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
