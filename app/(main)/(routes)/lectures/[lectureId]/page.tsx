"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { useLectureService, type LectureFileRow } from "@/services/lectures/lecture.service";
import type { Assessment } from "@/services/lectures/lecture.service";
import { AssessmentEditor } from "@/components/lectures/viewers/assessment-editor";
import { SummaryViewer } from "@/components/lectures/viewers/summary-viewer";
import { FlashcardViewer } from "@/components/lectures/viewers/flashcard-viewer";
import { LectureOverviewSection } from "@/components/lectures/viewers/lecture-overview-section";
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
  const availableTabs = isOwner ? ["overview", "summary", "flashcards", "edit-quiz"] : ["overview", "summary", "flashcards"];
  const defaultTab = searchParams.get("tab") ?? "overview";
  const [activeTab, setActiveTab] = useState(availableTabs.includes(defaultTab) ? defaultTab : availableTabs[0]);
  const [submittingAssessmentId, setSubmittingAssessmentId] = useState<string | null>(null);
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
  const draftAssessment = lecture?.assessment?.isDraft ? (lecture.assessment as Assessment) : null;
  const persistedAssessments = assessments.filter((assessment) => !assessment.isDraft);
  const reviewAssessment = persistedAssessments[0] ?? null;

  const getLectureHref = (tab: string) =>
    `/lectures/${lectureId as string}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}&tab=${encodeURIComponent(tab)}`;

  useEffect(() => {
    if (availableTabs.includes(defaultTab) && activeTab !== defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, availableTabs, defaultTab]);

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

  const handleGenerateQuiz = async (questionCount: number) => {
    const generatedAssessment = await generateQuiz(questionCount);

    if (generatedAssessment?.id) {
      setActiveTab("edit-quiz");
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
              {isOwner ? "Owner view" : "Member view"}
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
                <TabsList className={`grid w-full bg-transparent gap-0 ${isOwner ? "grid-cols-4" : "grid-cols-3"}`}>
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
                  {isOwner ? (
                    <TabsTrigger
                      value="edit-quiz"
                      className="rounded-none border-b-transparent text-slate-300 data-[state=active]:border-b-cyan-400 data-[state=active]:text-cyan-200 data-[state=active]:bg-transparent hover:text-white transition-colors"
                    >
                      Edit Quiz
                    </TabsTrigger>
                  ) : null}
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
                    isStudentView={isStudentView}
                    generating={generating}
                    onGenerateSummary={generateSummary}
                    onGenerateFlashcards={generateFlashcards}
                    onGenerateQuiz={handleGenerateQuiz}
                    onOpenQuiz={() => {
                      router.push(
                        `/lectures/${lectureId as string}/quiz?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}&view=student`
                      );
                    }}
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

                <TabsContent value="edit-quiz" className="space-y-4 mt-0">
                  {draftAssessment ? (
                    <AssessmentEditor
                      assessment={draftAssessment}
                      onChanged={async () => {
                        await fetchLecture();
                      }}
                    />
                  ) : null}

                  {reviewAssessment ? (
                    <Card className="border border-white/10 bg-white/5 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{reviewAssessment.title}</h3>
                        <p className="text-sm text-slate-400">
                          {reviewAssessment.type} · {reviewAssessment.status} · {reviewAssessment.totalQuestions} questions
                        </p>
                      </div>

                      <div className="space-y-4">
                        {reviewAssessment.questions?.map((question, index) => (
                          <div key={question.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-cyan-200">Question {index + 1}</p>
                                <h4 className="text-base font-medium text-white">{question.questionText}</h4>
                              </div>
                              <div className="text-sm text-slate-400">{question.points} pts</div>
                            </div>

                            {question.explanation ? (
                              <p className="text-sm text-slate-300">{question.explanation}</p>
                            ) : null}

                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className={`rounded-lg border px-3 py-2 text-sm ${
                                    option.isCorrect
                                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                                      : "border-white/10 bg-white/5 text-slate-200"
                                  }`}
                                >
                                  {option.optionText}
                                  {option.isCorrect ? " (correct)" : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : !draftAssessment ? (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
                        <p className="text-slate-300">No assessments generated yet. Generate one from Overview tab.</p>
                      </div>
                    ) : null}
                  </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
