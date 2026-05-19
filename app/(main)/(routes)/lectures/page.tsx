"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useLectureService } from "@/services/lectures/lecture.service";
import { LectureFileType } from "@/types/lecture";

import { useToast } from "@/hooks/use-toast";

import { FileUpload } from "@/components/common/file-upload";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2, ArrowLeft } from "lucide-react";

type UploadedFile = {
  url: string;
  type?: string;
};

export default function UploadLecturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lectureService = useLectureService();
  const { toast } = useToast();

  // const channelId = searchParams.get("channelId");
  // const memberId = searchParams.get("memberId");

  // For testing purposes, we can hardcode these values or fetch them from a user context
  const channelId = "2fda40a0-2e99-469c-8eee-deb4a6fe52b0";
  const memberId = "a816e01a-dd2f-447f-a3e6-7dbb49b4e75a"

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");

  const [file, setFile] = useState<string | undefined>();

  const [fileType, setFileType] = useState<LectureFileType>(
    LectureFileType.PDF
  );

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

      router.push(`/lectures/${result.lecture.id}`);
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href="/lectures">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          Upload Lecture
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="text-sm font-medium mb-2 block">
              Lecture Title
            </label>

            <Input
              placeholder="e.g. Introduction to Machine Learning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* <div>
            <label className="text-sm font-medium mb-2 block">
              File Type
            </label>

            <Select
              value={fileType}
              onValueChange={(value) =>
                setFileType(value as LectureFileType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={LectureFileType.PDF}>
                  PDF
                </SelectItem>

                <SelectItem value={LectureFileType.DOCX}>
                  DOCX
                </SelectItem>

                <SelectItem value={LectureFileType.TXT}>
                  TXT
                </SelectItem>

                <SelectItem value={LectureFileType.IMAGE}>
                  IMAGE
                </SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Upload File
            </label>

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

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Lecture"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
