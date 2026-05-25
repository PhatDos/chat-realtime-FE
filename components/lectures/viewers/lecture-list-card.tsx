"use client";

import { Card } from "@/components/ui/card";
import type { Lecture } from "@/services/lectures/lecture.service";
import { Loader2, FileText, ChevronRight } from "lucide-react";

interface LectureListCardProps {
  lectures: Lecture[];
  lecturesLoading: boolean;
  isNavigating: boolean;
  channelName?: string;
  onLectureClick: (lectureId: string) => void;
}

export function LectureListCard({
  lectures,
  lecturesLoading,
  isNavigating,
  channelName,
  onLectureClick,
}: LectureListCardProps) {
  return (
    <Card className="overflow-hidden border border-white/10 bg-white/5 p-0 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Channel Lectures</h2>
            {channelName && (
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                Channel:
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.10)]">
                  {channelName}
                </div>
              </div>
            )}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {lectures.length} total
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6">
        {!lecturesLoading && lectures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            No lectures uploaded for this channel yet.
          </div>
        ) : lecturesLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Loading lectures...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Uploaded by</th>
                  <th className="px-4 py-3 font-medium">Uploaded at</th>
                  <th className="px-4 py-3 font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {lectures.map((lecture, index) => (
                  <tr
                    key={lecture.id}
                    className="border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/5"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-4 py-3 text-white">{lecture.title}</td>
                    <td className="px-4 py-3 text-slate-300">{lecture.fileType}</td>
                    <td className="px-4 py-3 text-slate-300">{lecture.member?.profile?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-300">{new Date(lecture.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onLectureClick(lecture.id)}
                        className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                        disabled={isNavigating}
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}