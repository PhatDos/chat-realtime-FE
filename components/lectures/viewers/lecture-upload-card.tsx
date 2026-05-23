"use client";

import type { FormEvent } from "react";
import { FileUpload } from "@/components/common/file-upload";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, BookOpen } from "lucide-react";
import type { LectureFileType } from "@/types/lecture";

interface LectureUploadCardProps {
  title: string;
  file?: string;
  fileType: LectureFileType;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onFileChange: (value?: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LectureUploadCard({
  title,
  file,
  fileType,
  loading,
  onTitleChange,
  onFileChange,
  onSubmit,
}: LectureUploadCardProps) {
  return (
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

      <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Lecture Title</label>
          <Input
            placeholder="e.g. Introduction to Machine Learning"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Upload File</label>
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 transition-colors duration-200 hover:border-cyan-400/40 hover:bg-white/8">
            <FileUpload
              value={file || ""}
              onChange={(value) => {
                if (typeof value === "string") {
                  onFileChange(value);
                } else {
                  onFileChange(value?.url);
                }
              }}
              endpoint="messageFile"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-400 text-slate-950 transition-all duration-200 hover:bg-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)]"
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
  );
}