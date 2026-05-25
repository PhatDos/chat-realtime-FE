"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2} from "lucide-react";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { AssessmentEditor } from "@/components/lectures/viewers/assessment-editor";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { useState } from "react";

export default function AssessmentEditorPage() {
  const { lectureId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const assessmentId = searchParams.get("assessmentId") ?? "";
  const serverId = searchParams.get("serverId") ?? "";
  const channelId = searchParams.get("channelId") ?? "";
  const memberId = searchParams.get("memberId") ?? "";

  const { lecture, loading, fetchLecture } = useLectureData(lectureId as string);

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  const handleBackClick = () => {
    setIsNavigating(true);
    router.push(`/lectures/${lectureId}?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(channelId)}&memberId=${encodeURIComponent(memberId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading editor...</p>
        </div>
      </div>
    );
  }

  const assessment = lecture?.assessment?.id === assessmentId ? lecture.assessment : null;
  const isOwner = lecture?.memberId === memberId;

  if (!lecture || !assessment) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-slate-300">Assessment not found. Go back to lecture.</p>
          <div className="mt-4">
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={handleBackClick}
              disabled={isNavigating}
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl space-y-4 max-w-md">
          <p className="text-slate-300">Only the lecture owner can edit or publish this assessment.</p>
          <div>
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={handleBackClick}
              disabled={isNavigating}
              type="button"
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <LoadingOverlay isLoading={isNavigating} text="Navigating..." />
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit assessment</h1>
            <p className="text-sm text-slate-400">{assessment.title}</p>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="border border-white/10 text-slate-200"
              onClick={handleBackClick}
              disabled={isNavigating}
              type="button"
            >
              Back
            </Button>
          </div>
        </div>

        <AssessmentEditor
          assessment={assessment}
          onChanged={async () => {
            await fetchLecture();
          }}
        />
      </div>
    </div>
  );
}
