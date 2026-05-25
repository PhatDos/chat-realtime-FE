"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { deletePost, likePost, unlikePost } from "@/services/posts-client-service";

import { PostCard } from "./post-card";
import type { FeedPost } from "./types";

interface PostDetailPageProps {
  currentUserId: string;
  initialPost: FeedPost;
}

export const PostDetailPage = ({ currentUserId, initialPost }: PostDetailPageProps) => {
  const [post, setPost] = useState(initialPost);
  const [isDeleting, setIsDeleting] = useState(false);
  const api = useApiClient();
  const router = useRouter();
  const { toast } = useToast();

  const handleLike = async (postId: string, currentIsLiked: boolean) => {
    const nextLiked = !currentIsLiked;

    setPost((prev) => ({
      ...prev,
      isLiked: nextLiked,
      likeCount: Math.max(0, prev.likeCount + (nextLiked ? 1 : -1)),
    }));

    try {
      if (nextLiked) {
        await likePost(api, postId);
      } else {
        await unlikePost(api, postId);
      }
    } catch {
      setPost((prev) => ({
        ...prev,
        isLiked: currentIsLiked,
        likeCount: Math.max(0, prev.likeCount + (currentIsLiked ? 1 : -1)),
      }));

      toast({
        title: "Action failed",
        description: "Could not update your like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await deletePost(api, postId);
      toast({
        title: "Post deleted",
        description: "The post was removed successfully.",
        variant: "success",
      });
      router.push("/newsfeed");
    } catch {
      toast({
        title: "Cannot delete post",
        description: "You may not be the author or the post no longer exists.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_22%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_46%,_#e4e4e7_100%)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_#0a0a0b_0%,_#111113_45%,_#18181b_100%)] dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/75">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/newsfeed")}
            className="rounded-full border border-zinc-200/80 bg-white/80 px-4 text-zinc-700 hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to newsfeed
          </Button>
          <div className="ml-auto rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            Post detail
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <PostCard
            post={post}
            currentUserId={currentUserId}
            onLike={handleLike}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            onCommentAdded={() => {
              setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
            }}
          />
        </div>
      </main>
    </div>
  );
};