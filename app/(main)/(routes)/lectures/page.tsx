"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLectureService, type Lecture } from "@/services/lectures/lecture.service";
import { LectureFileType } from "@/types/lecture";
import { useToast } from "@/hooks/use-toast";
import { useServerSidebarQuery } from "@/hooks/use-server-sidebar-query";

import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

import { LectureUploadCard } from "@/components/lectures/viewers/lecture-upload-card";
import { LectureListCard } from "@/components/lectures/viewers/lecture-list-card";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<string | undefined>();
  const [fileType] = useState<LectureFileType>(LectureFileType.PDF);

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

  const backHref =
    serverId && channelId
      ? `/servers/${encodeURIComponent(serverId)}/channels/${encodeURIComponent(channelId)}`
      : "/lectures";

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

      const result = await lectureService.createLecture({
        title,
        fileUrl: file,
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
                fileType={fileType}
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
        </div>
      </div>
    </>
  );
}
