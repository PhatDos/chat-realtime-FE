"use client";

import { Summary } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface SummaryViewerProps {
  summary: Summary;
}

export function SummaryViewer({ summary }: SummaryViewerProps) {
  return (
    <Card className="p-6 border border-white/10 bg-white/5 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">Summary</h3>
          <span className="text-xs text-cyan-200 bg-cyan-400/10 px-2 py-1 rounded-full border border-cyan-400/20">
            {summary.tone}
          </span>
        </div>

        <div className="prose prose-sm text-slate-200 dark:prose-invert max-w-none">
          <ReactMarkdown>{summary.contentMarkdown}</ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}
