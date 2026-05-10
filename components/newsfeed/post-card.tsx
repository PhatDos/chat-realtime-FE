"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FileText, Globe, Heart, Lock, MessageCircle, Trash2, Users } from "lucide-react";

import { ProfileHoverCard } from "@/components/common/profile-hover-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CountUp from "@/components/animation/count-up";

import { FeedPost, FeedComment } from "./types";
import { PostComments } from "./post-comments";

interface PostCardProps {
  post: FeedPost;
  onLike: (postId: string, isLiked: boolean) => void;
  currentUserId: string;
  onDelete: (postId: string) => void;
  isDeleting?: boolean;
  onCommentAdded?: (postId: string) => void;
  onRegisterCommentCallback?: (postId: string, callback: (comment: FeedComment) => void) => () => void;
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString();
};

export const PostCard = ({ post, onLike, currentUserId, onDelete, isDeleting = false, onCommentAdded, onRegisterCommentCallback }: PostCardProps) => {
  const [showComments, setShowComments] = useState(Boolean(post.comments?.length));
  const prevLikeCountRef = useRef(post.likeCount);
  const [animationKey, setAnimationKey] = useState(0);
  const [likeDirection, setLikeDirection] = useState<"up" | "down">("up");
  
  const canDelete = post.author.id === currentUserId;

  useEffect(() => {
    if (post.likeCount !== prevLikeCountRef.current) {
      setLikeDirection(post.likeCount > prevLikeCountRef.current ? "up" : "down");
      setAnimationKey((prev) => prev + 1);
      prevLikeCountRef.current = post.likeCount;
    }
  }, [post.likeCount]);

  return (
    <Card className="border-zinc-200 dark:border-zinc-700/70 bg-gradient-to-br from-white to-zinc-50/50 dark:from-[#2b2d31] dark:to-zinc-900/20 shadow-sm hover:shadow-md transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-600">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <ProfileHoverCard
              id={post.author.id}
              name={post.author.name}
              imageUrl={post.author.imageUrl}
              currentProfileId={currentUserId}
              href={`/profile/${post.author.id}`}
              className="h-9 w-9"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{post.author.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <p>{formatDate(post.createdAt)}</p>
                <span>•</span>
                <TooltipProvider delayDuration={50}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        {post.visibility === "PUBLIC" && <Globe className="h-3 w-3" />}
                        {post.visibility === "FRIENDS" && <Users className="h-3 w-3" />}
                        {post.visibility === "PRIVATE" && <Lock className="h-3 w-3" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent hideArrow>
                      <p className="capitalize">{post.visibility.toLowerCase()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm whitespace-pre-wrap leading-6 text-zinc-800 dark:text-zinc-100">{post.content}</p>

        {post.fileType === "img" && post.fileUrl && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <Image
              src={post.fileUrl}
              alt="Post image"
              width={1200}
              height={900}
              className="h-auto w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {post.fileType === "pdf" && (
          <a
            href={post.fileUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            <FileText className="h-4 w-4" />
            Open PDF attachment
          </a>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => onLike(post.id, post.isLiked)}
            className="group relative hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Heart className={`h-4 w-4 transition-all ${post.isLiked ? "fill-red-500 text-red-500 scale-125" : "group-hover:scale-110 text-zinc-600 dark:text-zinc-400"}`} />
            <span className="ml-1.5 text-xs">
              <CountUp 
                key={animationKey}
                to={post.likeCount} 
                from={prevLikeCountRef.current}
                direction={likeDirection}
                duration={0.6}
                className="font-medium"
              />
            </span>
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowComments(!showComments)}
            className="group hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span className="ml-1.5 text-xs">{post.commentCount || 0}</span>
          </Button>

          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post.id)}
              disabled={isDeleting}
              className="ml-auto hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-1.5 text-xs">{isDeleting ? "Deleting..." : "Delete"}</span>
            </Button>
          )}
        </div>

        {showComments && (
          <PostComments 
            postId={post.id} 
            currentUserId={currentUserId} 
            onCommentAdded={() => onCommentAdded?.(post.id)} 
            initialComments={post.comments}
            onRegisterCommentCallback={onRegisterCommentCallback}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const PostCardSkeleton = () => {
  return (
    <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white/95 dark:bg-[#2b2d31]">
      <CardContent className="p-4 space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-2 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-11/12 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-9/12 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
      </CardContent>
    </Card>
  );
};