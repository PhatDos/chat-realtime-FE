"use client";

import { useMemo, useState } from "react";
import { Globe, Lock, Users, FileIcon, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/common/emoji-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/lib/uploadthing";
import "@uploadthing/react/styles.css";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import type { ClientUploadedFileData } from "uploadthing/types";

import { createPost } from "@/services/posts-client-service";

import { FeedAuthor, FeedPost } from "./types";

interface CreatePostBoxProps {
  author: FeedAuthor;
  onCreated: (post: FeedPost) => void;
}

interface FileValue {
  url: string;
  type?: string;
}

export const CreatePostBox = ({ author, onCreated }: CreatePostBoxProps) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<FileValue | undefined>(undefined);
  const api = useApiClient();
  const { toast } = useToast();

  const isDisabled = useMemo(() => content.trim().length === 0, [content]);

  const handleFileUpload = (res: ClientUploadedFileData<unknown>[]) => {
    if (res && res.length > 0) {
      const uploadedFile = res[0];
      setFile({
        url: uploadedFile.ufsUrl,
        type: uploadedFile.type,
      });
      setShowUpload(false);
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setShowUpload(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((current) => (current ? `${current} ${emoji}` : emoji));
  };

  const handleSubmit = async () => {
    if (isDisabled || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      let fileType: "text" | "img" | "pdf" = "text";
      let fileUrl: string | undefined = undefined;

      if (file?.url) {
        fileUrl = file.url;
        fileType = file.type?.toLowerCase().includes("pdf") ? "pdf" : "img";
      }

      const post = await createPost(api, {
        content: content.trim(),
        fileUrl,
        fileType,
        visibility,
      });

      onCreated(post);
      setContent("");
      setFile(undefined);
    } catch {
      toast({
        title: "Cannot create post",
        description: "Failed to publish this post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {/* <Link href={`/profile/${author.id}`} className="group shrink-0">
          <UserAvatar
            src={author.imageUrl}
            className="h-10 w-10 ring-2 ring-white/70 dark:ring-white/10"
          />
        </Link> */}
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What's on your mind?"
            className="min-h-28 w-full resize-none rounded-3xl border border-zinc-200/80 bg-white/85 p-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
          />

          {file?.url && !file.type?.toLowerCase().includes("pdf") && (
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1c1c20]">
              <Image
                src={file.url}
                alt="Post image"
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute right-2 top-2 rounded-full bg-zinc-950 p-1.5 text-white shadow-lg shadow-zinc-950/20 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {file?.url && file.type?.toLowerCase().includes("pdf") && (
            <div className="relative flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <FileIcon className="h-10 w-10 fill-zinc-200 stroke-zinc-500 dark:fill-white/10 dark:stroke-zinc-300" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-200"
              >
                PDF File
              </a>
              <button
                onClick={handleRemoveFile}
                className="absolute -right-2 -top-2 rounded-full bg-zinc-950 p-1.5 text-white shadow-lg shadow-zinc-950/20 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {showUpload && !file?.url && (
            <div className="mt-2">
              <UploadDropzone
                endpoint="postFile"
                onClientUploadComplete={handleFileUpload}
                onUploadError={(err) => {
                  console.error(err);
                  toast({
                    title: "Upload failed",
                    description: "Failed to upload file. Please try again.",
                    variant: "destructive",
                  });
                }}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {!file?.url && !showUpload && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(true)}
                  className="rounded-full px-3 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                >
                  <span>📎 Add File</span>
                </Button>
              )}
              {showUpload && !file?.url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                  className="rounded-full px-3 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                >
                  <span>✕ Cancel</span>
                </Button>
              )}
              <Select value={visibility} onValueChange={(value: "PUBLIC" | "FRIENDS" | "PRIVATE") => setVisibility(value)}>
                <SelectTrigger className="h-9 w-[110px] rounded-full border-zinc-200/80 bg-zinc-50 text-xs shadow-none focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:focus:ring-white/10">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#2b2d31]">
                  <SelectItem value="PUBLIC" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Globe className="h-2.5 w-2.5" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="FRIENDS" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Users className="h-2.5 w-2.5" />
                      <span>Friends</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Private</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <EmojiPicker onChange={handleEmojiSelect} />
            </div>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isDisabled || isSubmitting}
              className="rounded-full bg-zinc-500 px-4 text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};