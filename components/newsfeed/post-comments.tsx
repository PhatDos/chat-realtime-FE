"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { createPostComment, getPostComments } from "@/services/posts-client-service";

import { FeedComment } from "./types";

interface PostCommentsProps {
  postId: string;
  currentUserId: string;
  onCommentAdded: () => void;
  initialComments?: FeedComment[];
  onRegisterCommentCallback?: (postId: string, callback: (comment: FeedComment) => void) => () => void;
}

export const PostComments = ({ postId, currentUserId, onCommentAdded, initialComments, onRegisterCommentCallback }: PostCommentsProps) => {
  const [comments, setComments] = useState<FeedComment[]>(initialComments || []);
  const [cursor, setCursor] = useState<string | null>(
    initialComments && initialComments.length > 0
      ? initialComments[initialComments.length - 1].createdAt
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(initialComments === undefined);
  const [hasMore, setHasMore] = useState(initialComments ? initialComments.length === 3 : true);

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const api = useApiClient();
  const { toast } = useToast();

  const loadComments = useCallback(async (currentCursor: string | null = null) => {
    try {
      setIsLoading(true);
      const res = await getPostComments(api, postId, currentCursor);
      
      if (currentCursor) {
        setComments((prev) => [...prev, ...res.items]);
      } else {
        setComments(res.items);
      }
      
      setCursor(res.nextCursor);
      setHasMore(res.nextCursor !== null);
    } catch {
      toast({
        title: "Cannot load comments",
        description: "Failed to fetch comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [api, postId, toast]);

  // Register real-time comment callback with parent
  useEffect(() => {
    if (!onRegisterCommentCallback) return;

    const handleRealtimeComment = (comment: FeedComment) => {
      setComments((prev) => {
        // Don't add if comment ID already exists (prevent duplicates)
        if (prev.some((c) => c.id === comment.id)) {
          return prev;
        }
        // Don't add if from current user (they already added it locally)
        if (comment.author.id === currentUserId) {
          return prev;
        }
        return [comment, ...prev];
      });
    };

    const unregister = onRegisterCommentCallback(postId, handleRealtimeComment);
    return () => {
      if (unregister) {
        unregister();
      }
    };
  }, [postId, currentUserId, onRegisterCommentCallback]);

  useEffect(() => {
    if (initialComments === undefined) {
      void loadComments();
    }
  }, [loadComments, initialComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newComment = await createPostComment(api, postId, content);
      setComments((prev) => [newComment, ...prev]);
      setContent("");
      onCommentAdded();
    } catch {
      toast({
        title: "Cannot post comment",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-4 space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700/70">
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          maxLength={1000}
          className="flex-1 h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-1 text-sm outline-none focus-visible:ring-2 ring-indigo-500/50"
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {isInitialLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <UserAvatar src={comment.author.imageUrl} className="h-8 w-8 mt-0.5" />
              <div className="flex-1">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold">{comment.author.name}</p>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
                <p className="text-xs text-zinc-500 mt-1 px-1">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
          ))}

          {hasMore && comments.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => void loadComments(cursor)}
                disabled={isLoading}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:underline transition"
              >
                {isLoading ? "Loading..." : "View more comments"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
