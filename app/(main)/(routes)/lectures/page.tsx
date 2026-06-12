"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  useLectureService,
  type ChannelLeaderboardQuiz,
  type ChannelLeaderboardEntry,
  type ChannelLeaderboardResponse,
  type Lecture,
} from "@/services/lectures/lecture.service";
import { LectureFileType } from "@/types/lecture";
import { useToast } from "@/hooks/use-toast";
import { useServerSidebarQuery } from "@/hooks/use-server-sidebar-query";

import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trophy, Loader2 } from "lucide-react";

import { LectureUploadCard } from "@/components/lectures/viewers/lecture-upload-card";
import { LectureListCard } from "@/components/lectures/viewers/lecture-list-card";

type LeaderboardMode = "gradebook" | "leaderboard";

type LeaderboardRow = ChannelLeaderboardEntry & {
  completedCount: number;
  averageScore: number;
};

export default function UploadLecturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lectureService = useLectureService();
  const { toast } = useToast();

  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";
  const isStudentView = searchParams.get("view") === "student";

  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ChannelLeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("gradebook");
  const [isNavigating, setIsNavigating] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<{ url: string; type?: string } | undefined>();

  const { data: serverSidebarData } = useServerSidebarQuery({
    serverId,
    enabled: Boolean(serverId),
  });
  const channelName = serverSidebarData?.server.channels.find((channel) => channel.id === channelId)?.name;

  useEffect(() => {
    if (!serverId || !channelId) return;

    const loadLectures = async () => {
      setLecturesLoading(true);

      try {
        const data = await lectureService.getLecturesByChannel(serverId, channelId);
        setLectures(data);
      } catch (error) {
        console.error("Failed to load lectures", error);
      } finally {
        setLecturesLoading(false);
      }
    };

    void loadLectures();
  }, [channelId, lectureService, serverId]);

  useEffect(() => {
    if (!channelId) return;

    let mounted = true;

    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);

      try {
        const data = await lectureService.getQuizLeaderboard(channelId);
        if (mounted) {
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        if (mounted) {
          setLeaderboardLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [channelId, lectureService]);

  const backHref =
    serverId && channelId
      ? `/servers/${encodeURIComponent(serverId)}/channels/${encodeURIComponent(channelId)}`
      : "/lectures";

  const leaderboardquizzes: ChannelLeaderboardQuiz[] = leaderboard?.quizzes ?? [];
  const leaderboardEntries: ChannelLeaderboardEntry[] = leaderboard?.entries ?? [];
  const leaderboardChannelName = channelName || leaderboard?.channelName || channelId;

  const leaderboardRows: LeaderboardRow[] = leaderboardEntries.map((entry) => {
    const completedCount = entry.quizScores.filter((score) => score.scorePercent != null).length;
    const totalScore = entry.quizScores.reduce((sum, score) => sum + (score.scorePercent ?? 0), 0);
    const totalQuizzes = leaderboardquizzes.length || entry.quizScores.length;

    return {
      ...entry,
      completedCount,
      averageScore: totalQuizzes > 0 ? totalScore / totalQuizzes : 0,
    };
  });

  const rankedLeaderboardRows = [...leaderboardRows].sort((firstRow, secondRow) => {
    const firstAverage = firstRow.averageScore ?? -1;
    const secondAverage = secondRow.averageScore ?? -1;

    if (secondAverage !== firstAverage) {
      return secondAverage - firstAverage;
    }

    if (secondRow.completedCount !== firstRow.completedCount) {
      return secondRow.completedCount - firstRow.completedCount;
    }

    const firstName = firstRow.member?.profile?.name ?? firstRow.memberId;
    const secondName = secondRow.member?.profile?.name ?? secondRow.memberId;

    return firstName.localeCompare(secondName);
  });

  const visibleRows = leaderboardMode === "gradebook" ? leaderboardRows : rankedLeaderboardRows;

  const handleBackClick = () => {
    setIsNavigating(true);
    router.push(backHref);
  };

  const handleLectureClick = (lectureId: string) => {
    setIsNavigating(true);
    router.push(
      `/lectures/${lectureId}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}${isStudentView ? "&view=student" : ""}`
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!channelId || !memberId) {
      toast({
        title: "Error",
        description: "Missing channel or member information",
        variant: "destructive",
      });

      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please upload a file",
        variant: "destructive",
      });

      return;
    }

    try {
      setLoading(true);

      const fileType = LectureFileType.PDF;

      const result = await lectureService.createLecture({
        title,
        fileUrl: file.url,
        fileType,
        channelId,
        memberId,
      });

      toast({
        title: "Success",
        description: "Lecture uploaded successfully",
      });

      setIsNavigating(true);
      router.push(
        `/lectures/${result.lecture.id}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload lecture";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isNavigating} text="Navigating..." />
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handleBackClick}
              disabled={isNavigating}
              variant="ghost"
              size="sm"
              className="group border border-white/10 bg-white/5 text-slate-200 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to channel
            </Button>

            <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
              <Sparkles className="h-4 w-4" />
              Lectures workspace
            </div>
          </div>

          <div className={isStudentView ? "grid gap-6" : "grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"}>
            {!isStudentView && (
              <LectureUploadCard
                title={title}
                file={file}
                loading={loading}
                onTitleChange={setTitle}
                onFileChange={setFile}
                onSubmit={handleSubmit}
              />
            )}

            <LectureListCard
              lectures={lectures}
              lecturesLoading={lecturesLoading}
              isNavigating={isNavigating}
              channelName={channelName}
              onLectureClick={handleLectureClick}
            />
          </div>

          <div className="space-y-4">
            <Card className="border border-white/10 bg-white/5 rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white inline-flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-cyan-300" />
                    {leaderboardMode === "gradebook" ? "Gradebook" : "Leaderboard"}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {leaderboardMode === "gradebook"
                      ? `Channel: ${leaderboardChannelName} · per-quiz view`
                      : `Channel: ${leaderboardChannelName} · ranked by average score`}
                  </p>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {leaderboardEntries.length} members
                </div>
              </div>

              <div className="inline-flex rounded-full border border-white/10 bg-slate-950/40 p-1">
                <button
                  type="button"
                  onClick={() => setLeaderboardMode("gradebook")}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    leaderboardMode === "gradebook"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Gradebook
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardMode("leaderboard")}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    leaderboardMode === "leaderboard"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Leaderboard
                </button>
              </div>

              {leaderboardLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  Loading leaderboard...
                </div>
              ) : leaderboardquizzes.length > 0 ? (
                leaderboardMode === "gradebook" ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                    <table className="min-w-full divide-y divide-white/10 text-center text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Name</th>
                          {leaderboardquizzes.map((quiz) => (
                            <th key={quiz.id} className="px-4 py-3 font-medium whitespace-nowrap">
                              {quiz.title}
                            </th>
                          ))}
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {visibleRows.map((entry, index) => (
                          <tr key={entry.memberId} className="bg-slate-950/20">
                            <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">
                                {entry.member?.profile?.name ?? entry.memberId}
                              </div>
                            </td>
                            {entry.quizScores.map((score) => (
                              <td key={score.quizId} className="px-4 py-3 text-slate-200 whitespace-nowrap">
                                {score.scorePercent == null ? (
                                  <span className="text-slate-500">Not attempted</span>
                                ) : (
                                  `${score.scorePercent.toFixed(1)}%`
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 font-semibold text-cyan-200 whitespace-nowrap">
                              {`${entry.averageScore.toFixed(1)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                    <table className="min-w-full divide-y divide-white/10 text-center text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 font-medium">Rank</th>
                          <th className="px-4 py-3 font-medium">User</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Avg Score</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {visibleRows.map((entry, index) => (
                          <tr key={entry.memberId} className="bg-slate-950/20">
                            <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">
                                {entry.member?.profile?.name ?? entry.memberId}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-cyan-200 whitespace-nowrap">
                              {`${entry.averageScore.toFixed(1)}%`}
                            </td>
                            <td className="px-4 py-3 text-slate-200 whitespace-nowrap">{entry.completedCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-slate-300">
                  No leaderboard data yet.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
