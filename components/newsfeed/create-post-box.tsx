"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Globe, Lock, Users, FileIcon, X } from "lucide-react";
import Image from "next/image";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="border-zinc-200 dark:border-zinc-700/70 bg-gradient-to-br from-white to-zinc-50/50 dark:from-[#2b2d31] dark:to-zinc-900/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${author.id}`} className="group shrink-0">
            <UserAvatar
              src={author.imageUrl}
              className="h-10 w-10 ring-2 ring-indigo-200 dark:ring-indigo-900/50"
            />
          </Link>
          <div className="flex-1 space-y-2">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-28 rounded-lg border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 text-sm resize-none outline-none focus-visible:ring-2 ring-offset-0 ring-indigo-500/50 transition-all hover:bg-white dark:hover:bg-zinc-800/60"
            />

            {/* File Preview */}
            {file?.url && !file.type?.toLowerCase().includes("pdf") && (
              <div className="relative w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <Image
                  src={file.url}
                  alt="Post image"
                  width={1200}
                  height={900}
                  className="w-full h-auto object-cover"
                />
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-sm hover:bg-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {file?.url && file.type?.toLowerCase().includes("pdf") && (
              <div className="relative flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
                >
                  PDF File
                </a>
                <button
                  onClick={handleRemoveFile}
                  className="absolute -top-2 -right-2 p-1 bg-rose-500 rounded-full shadow-sm text-white hover:bg-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* File Upload Area */}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!file?.url && !showUpload && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUpload(true)}
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
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
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    <span>✕ Cancel</span>
                  </Button>
                )}
                <Select value={visibility} onValueChange={(value: "PUBLIC" | "FRIENDS" | "PRIVATE") => setVisibility(value)}>
                  <SelectTrigger className="w-[110px] h-8 text-xs bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-transparent focus:ring-0 focus:ring-offset-0 hover:from-indigo-200 hover:to-purple-200 transition-all">
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  Share a short update.
                </p>
              </div>
              <Button 
                type="button" 
                onClick={() => void handleSubmit()} 
                disabled={isDisabled || isSubmitting}
                className="bg-gradient-to-r from-indigo-50 to-purple-200 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};