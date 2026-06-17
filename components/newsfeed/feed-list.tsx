"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useSession } from "@clerk/nextjs";

import { deletePost, getUserPosts, likePost, unlikePost } from "@/services/posts-client-service";
import { buildBearerHeaders, isJwtExpired, POSTS_EVENTS_URL, type PostsEventPayload } from "@/lib/sse-client";
import { PostCard, PostCardSkeleton } from "./post-card";
import { FeedPost, FeedComment } from "./types";

const FEED_PAGE_SIZE = 5;

interface FeedListProps {
  profileId: string;
  newPost: FeedPost | null;
}

const mergeUnique = (posts: FeedPost[]) => {
  const seen = new Set<string>();
  const deduped: FeedPost[] = [];

  for (const post of posts) {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      deduped.push(post);
    }
  }

  return deduped;
};

export const FeedList = ({ profileId, newPost }: FeedListProps) => {
  const lastHandledExternalId = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const api = useApiClient();
  const { toast } = useToast();
  const { getToken } = useAuth(); // Moved getToken to component level
  const { session } = useSession();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  
  // Store callbacks for real-time comment updates for each post
  const commentCallbacksRef = useRef<Map<string, (comment: FeedComment) => void>>(new Map());
  // Track handled comment IDs to avoid processing duplicates (SSE duplicates / reconnects)
  const handledCommentIdsRef = useRef<Set<string>>(new Set());

  const hasMore = useMemo(() => cursor !== null, [cursor]);

  const getFreshSseToken = useCallback(async () => {
    let token = await getToken({ skipCache: true });

    if (isJwtExpired(token)) {
      await session?.reload();
      token = await getToken({ skipCache: true });
    }

    if (isJwtExpired(token, 0)) {
      throw new Error("SSE_TOKEN_EXPIRED");
    }

    return token;
  }, [getToken, session]);

  const prependPost = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const registerCommentCallback = useCallback((postId: string, callback: (comment: FeedComment) => void) => {
    commentCallbacksRef.current.set(postId, callback);
    return () => {
      commentCallbacksRef.current.delete(postId);
    };
  }, []);

  const resetFeed = useCallback(() => {
    lastHandledExternalId.current = null;
    setPosts([]);
    setCursor(null);
    setIsInitialLoading(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) {
      return;
    }

    if (posts.length > 0 && !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const page = await getUserPosts(api, cursor, FEED_PAGE_SIZE);

      setPosts((prev) => mergeUnique([...prev, ...page.items]));
      setCursor(page.nextCursor);
    } catch {
      toast({
        title: "Cannot load feed",
        description: "Failed to fetch posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [api, cursor, hasMore, isLoadingMore, posts.length, toast]);

  const handleLike = useCallback(
    async (postId: string, currentIsLiked: boolean) => {
      const nextLiked = !currentIsLiked;

      // Optimistic update: both isLiked and likeCount
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isLiked: nextLiked,
            likeCount: Math.max(0, post.likeCount + (nextLiked ? 1 : -1)),
          };
        })
      );

      try {
        if (nextLiked) {
          await likePost(api, postId);
        } else {
          await unlikePost(api, postId);
        }
      } catch {
        // Revert both on error
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              isLiked: currentIsLiked,
              likeCount: Math.max(0, post.likeCount + (currentIsLiked ? 1 : -1)),
            };
          })
        );
        toast({
          title: "Action failed",
          description: "Could not update your like. Please try again.",
          variant: "destructive",
        });
      }
    },
    [api, toast]
  );

  const handleDelete = useCallback(
    async (postId: string) => {
      if (deletingPostId) {
        return;
      }

      try {
        setDeletingPostId(postId);
        await deletePost(api, postId);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        toast({
          title: "Post deleted",
          description: "The post was removed successfully.",
          variant: "success",
        });
      } catch {
        toast({
          title: "Cannot delete post",
          description: "You may not be the author or the post no longer exists.",
          variant: "destructive",
        });
      } finally {
        setDeletingPostId(null);
      }
    },
    [api, deletingPostId, toast]
  );

  useEffect(() => {
    resetFeed();
  }, [profileId, resetFeed]);

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!newPost) {
      return;
    }

    if (newPost.id === lastHandledExternalId.current) {
      return;
    }

    lastHandledExternalId.current = newPost.id;
    prependPost(newPost);
  }, [newPost, prependPost]);

  // SSE
  useEffect(() => {
    let isActive = true;
    let controller: AbortController | null = null;
    let retryTimeoutId: number | null = null;

    const setupSSE = async () => {
      try {
        const token = await getFreshSseToken();

        if (!isActive) {
          return;
        }

        controller = new AbortController();

        const handlePayload = (payload: PostsEventPayload) => {
          switch (payload.type) {
            case "POST_CREATED": {
              // Skip new posts from current user (handled by optimistic update)
              if (payload.actionUserId === profileId) {
                return;
              }

              const post = payload.post as FeedPost;
              if (post && post.id !== lastHandledExternalId.current) {
                lastHandledExternalId.current = post.id;
                prependPost(post);
              }
              break;
            }

            case "POST_LIKED": {
              const { postId, likeCount } = payload;
              if (!postId || likeCount === undefined) return;

              // Update only if state differs from SSE (source of truth)
              setPosts((prev) => {
                const post = prev.find(p => p.id === postId);
                // If post not found or likeCount already matches, skip update
                if (!post || post.likeCount === likeCount) {
                  return prev;
                }
                // Apply SSE likeCount
                return prev.map((p) =>
                  p.id === postId ? { ...p, likeCount } : p
                );
              });
              break;
            }

            case "POST_UNLIKED": {
              const { postId, likeCount } = payload;
              if (!postId || likeCount === undefined) return;

              // Update only if state differs from SSE (source of truth)
              setPosts((prev) => {
                const post = prev.find(p => p.id === postId);
                // If post not found or likeCount already matches, skip update
                if (!post || post.likeCount === likeCount) {
                  return prev;
                }
                // Apply SSE likeCount
                return prev.map((p) =>
                  p.id === postId ? { ...p, likeCount } : p
                );
              });
              break;
            }

            case "COMMENT_ADDED": {
              const { postId, comment } = payload;
              if (!postId || !comment) return;

              if (comment.author.id === profileId) {
                return;
              }

              // Deduplicate by comment id to avoid double increments from duplicate SSE deliveries
              if (comment.id && handledCommentIdsRef.current.has(comment.id)) {
                return;
              }
              if (comment.id) handledCommentIdsRef.current.add(comment.id);

              // Update the FeedList post's comment count and comments
              setPosts((prev) =>
                prev.map((p) => {
                  if (p.id !== postId) return p;
                  const newComments = p.comments ? [comment, ...p.comments].slice(0, 3) : [comment];
                  return { ...p, comments: newComments, commentCount: (p.commentCount || 0) + 1 };
                })
              );
              
              // Notify PostComments component for this post if it's listening
              const postCommentCallback = commentCallbacksRef.current.get(postId);
              if (postCommentCallback) {
                postCommentCallback(comment);
              }
              break;
            }

            default:
              break;
          }
        };

        const { fetchEventSource } = await import("@microsoft/fetch-event-source");

        await fetchEventSource(POSTS_EVENTS_URL, {
          method: "GET",
          headers: buildBearerHeaders(token),
          signal: controller.signal,
          // Keep the SSE connection open even when the document becomes hidden
          openWhenHidden: true,
          onopen: async (response) => {
            if (response.status === 401) {
              throw new Error("SSE_UNAUTHORIZED");
            }

            if (!response.ok) {
              throw new Error(`SSE failed: ${response.status}`);
            }
          },
          onmessage: (e) => {
            try {
              const raw = typeof e.data === "string" ? e.data.trim() : "";

              // Ignore empty keep-alive or heartbeat messages
              if (!raw) return;

              // If data isn't JSON (e.g., plain text ping), skip parsing
              if (!(raw.startsWith("{") || raw.startsWith("["))) return;

              const parsed = JSON.parse(raw);

              // Some backends wrap the real payload inside an outer `{ data: payload }` object.
              // Normalize to support both shapes.
              const payload = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;

              if (payload && typeof payload === "object") {
                handlePayload(payload as PostsEventPayload);
              }
            } catch (err) {
              console.error("SSE parse error:", err);
            }
          },
          onerror: (err) => {
            console.error("SSE error:", err);
            throw err;
          },
        });
      } catch (error) {
        if (!isActive || controller?.signal.aborted) {
          return;
        }

        // SSE connection failed or was aborted
        console.error("SSE reconnecting after error:", error);
        retryTimeoutId = window.setTimeout(setupSSE, 3000);
      }
    };

    setupSSE();

    return () => {
      isActive = false;

      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId);
      }

      controller?.abort();
    };
  }, [getFreshSseToken, profileId, prependPost]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleCommentAdded = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        };
      })
    );
  }, []);

  if (isInitialLoading) {
    return (
      <div className="space-y-3">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          currentUserId={profileId}
          onDelete={handleDelete}
          isDeleting={deletingPostId === post.id}
          onCommentAdded={handleCommentAdded}
          onRegisterCommentCallback={registerCommentCallback}
        />
      ))}

      <div ref={sentinelRef} className="h-1" />

      <div className="flex justify-center py-8">
        {hasMore ? (
          isLoadingMore ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}>
              Load more
            </Button>
          )
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">You have reached the end of the feed.</p>
        )}
      </div>
    </div>
  );
};
