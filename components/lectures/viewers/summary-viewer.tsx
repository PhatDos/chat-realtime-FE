"use client";

import { Summary } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface SummaryViewerProps {
  summary: Summary;
}

export function SummaryViewer({ summary }: SummaryViewerProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Summary</h3>
          <span className="text-xs bg-secondary px-2 py-1 rounded">
            {summary.tone}
          </span>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{summary.contentMarkdown}</ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}
