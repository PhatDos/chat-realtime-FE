"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useLectureService, type Lecture } from "@/services/lectures/lecture.service";
import { LectureFileType } from "@/types/lecture";

import { useToast } from "@/hooks/use-toast";

import { FileUpload } from "@/components/common/file-upload";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2, ArrowLeft, Sparkles, Upload, BookOpen, CalendarDays, UserRound, ChevronRight, FileText } from "lucide-react";

type UploadedFile = {
  url: string;
  type?: string;
};

export default function UploadLecturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lectureService = useLectureService();
  const { toast } = useToast();

  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";

  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  const [title, setTitle] = useState("");

  const [file, setFile] = useState<string | undefined>();

  const [fileType, setFileType] = useState<LectureFileType>(
    LectureFileType.PDF
  );

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

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

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

      router.push(
        `/lectures/${result.lecture.id}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload lecture";

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
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href={backHref}>
            <Button
              variant="ghost"
              size="sm"
              className="group border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to channel
            </Button>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
            <Sparkles className="h-4 w-4" />
            Lectures workspace
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden border border-white/10 bg-white/5 p-0 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">Upload Lecture</h2>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  Channel lectures
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Store the file, extract text on the backend, then generate AI materials from the saved content.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Lecture Title
                </label>

                <Input
                  placeholder="e.g. Introduction to Machine Learning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Upload File
                </label>

                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 transition-colors duration-200 hover:border-cyan-400/40 hover:bg-white/8">
                  <FileUpload
                    value={file || ""}
                    onChange={(value) => {
                      if (typeof value === 'string') {
                        setFile(value);
                      } else {
                        setFile(value?.url);
                      }
                    }}
                    endpoint="messageFile"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all duration-200 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Lecture
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden border border-white/10 bg-white/5 p-0 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Channel Lectures</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {channelId ? `Channel ${channelId}` : "No channel selected"}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {lectures.length} total
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              {!channelId ? (
                <p className="text-sm text-slate-300">
                  Missing channelId in the URL.
                </p>
              ) : lecturesLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                  Loading lectures...
                </div>
              ) : lectures.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
                  <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
                  No lectures uploaded for this channel yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {lectures.map((lecture, index) => (
                    <Link
                      key={lecture.id}
                      href={`/lectures/${lecture.id}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`}
                      className="group rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-950/20"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-medium text-white transition-colors duration-200 group-hover:text-cyan-200">
                              {lecture.title}
                            </h3>
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                              {lecture.fileType}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(lecture.createdAt).toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              {lecture.member?.profile?.name ?? "Unknown"}
                            </span>
                          </div>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-200 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 group-hover:text-cyan-200">
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
