"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  Clock3,
  UserMinus,
  Calendar,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/user-avatar";
import { QRCodeBlock } from "@/components/common/qr-code-block";
import { PostCard } from "@/components/newsfeed/post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import {
  cancelFriendRequest,
  getSentFriendRequests,
  sendFriendRequest,
  unfriend,
} from "@/services/friends-client-service";

import type { MockProfile } from "./mock-profile-data";
import { FeedPost } from "@/components/newsfeed/types";

interface ProfilePageProps {
  profile: MockProfile;
  currentUserId: string;
  profileUrl: string;
  targetProfileId: string;
}

export const ProfilePage = ({ profile, currentUserId, profileUrl, targetProfileId }: ProfilePageProps) => {
  const [isFriend, setIsFriend] = useState(profile.isFriend);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>(profile.posts);
  const api = useApiClient();
  const { toast } = useToast();

  const isOwnProfile = targetProfileId === currentUserId;

  useEffect(() => {
    const loadSentRequests = async () => {
      if (isOwnProfile || isFriend) {
        return;
      }

      try {
        const sentRequests = await getSentFriendRequests(api);
        const pendingRequest = sentRequests.find(
          (request) =>
            request.receiverId === targetProfileId && request.status === "PENDING"
        );
        setPendingRequestId(pendingRequest?.id ?? null);
      } catch {
        setPendingRequestId(null);
      }
    };

    void loadSentRequests();
  }, [api, isFriend, isOwnProfile, targetProfileId]);

  const handleAddFriend = async () => {
    if (isAdding || isFriend || pendingRequestId) {
      return;
    }

    try {
      setIsAdding(true);
      const request = await sendFriendRequest(api, targetProfileId);
      setPendingRequestId(request.id);

      toast({
        title: "Friend request sent",
        description: `Your friend request has been sent to ${profile.user.name}`,
        variant: "success",
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        title: "Cannot send request",
        description:
          err.response?.data?.message ??
          "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelRequest = async () => {
    if (isAdding || !pendingRequestId || isFriend) {
      return;
    }

    try {
      setIsAdding(true);
      await cancelFriendRequest(api, pendingRequestId);
      setPendingRequestId(null);

      toast({
        title: "Request canceled",
        description: `Friend request to ${profile.user.name} has been canceled`,
        variant: "success",
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        title: "Cannot cancel request",
        description:
          err.response?.data?.message ??
          "Failed to cancel friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUnfriend = async () => {
    if (isAdding || !isFriend) {
      return;
    }

    try {
      setIsAdding(true);
      await unfriend(api, targetProfileId);
      setIsFriend(false);

      toast({
        title: "Friend removed",
        description: `You are no longer friends with ${profile.user.name}`,
        variant: "success",
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        title: "Cannot remove friend",
        description:
          err.response?.data?.message ??
          "Failed to remove friend. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getFriendActionLabel = () => {
    if (isAdding) {
      if (isFriend) {
        return "Removing...";
      }

      if (pendingRequestId) {
        return "Canceling...";
      }

      return "Sending...";
    }

    if (isFriend) {
      return "Friends";
    }

    if (pendingRequestId) {
      return "Requested";
    }

    return "Add Friend";
  };

  const getFriendActionIcon = () => {
    if (isFriend) {
      return <UserCheck className="h-4 w-4" />;
    }

    if (pendingRequestId) {
      return <Clock3 className="h-4 w-4" />;
    }

    return <UserPlus className="h-4 w-4" />;
  };

  const getFriendActionVariant = () => {
    if (isFriend || pendingRequestId) {
      return "outline" as const;
    }

    return "default" as const;
  };

  const getFriendActionClassName = () => {
    if (pendingRequestId) {
      return "gap-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20";
    }

    return "gap-2";
  };

  const handleFriendAction = async () => {
    if (pendingRequestId) {
      await handleCancelRequest();
      return;
    }

    if (isFriend) {
      await handleUnfriend();
      return;
    }

    await handleAddFriend();
  };

  const handleLike = (postId: string, isLiked: boolean) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !isLiked,
            likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
          };
        }
        return post;
      })
    );
  };

  const handleDelete = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Active now";
      case "away":
        return "Away";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-[#313338] pb-8">
      {/* Header Banner */}
      <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-900/30 dark:to-purple-900/30 relative">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <Image
            src="/avatar-default-dark.svg"
            alt="Banner"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="max-w-4xl mx-auto px-4 relative -mt-16">
        <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="relative">
                <UserAvatar
                  src={profile.user.imageUrl}
                  className="h-32 w-32 ring-4 ring-white dark:ring-[#2b2d31] shadow-lg"
                />
                <div
                  className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white dark:border-[#2b2d31] ${getStatusColor(
                    profile.user.status
                  )}`}
                />
              </div>

              {/* Profile Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {profile.user.name}
                    </h1>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {getStatusText(profile.user.status)}
                    </span>
                  </div>

                  {profile.user.bio && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      {profile.user.bio}
                    </p>
                  )}

                  {/* User Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>
                        Joined{" "}
                        {new Date(profile.user.joinDate).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long" }
                        )}
                      </span>
                    </div>

                    {profile.user.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        <span>{profile.user.location}</span>
                      </div>
                    )}

                    {profile.user.website && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-indigo-500" />
                        <a
                          href={`https://${profile.user.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:underline"
                        >
                          {profile.user.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {isOwnProfile ? (
                    <Button variant="default">Edit Profile</Button>
                  ) : (
                    <>
                      {isFriend ? (
                        <>
                          <Button
                            variant="default"
                            className="gap-2"
                            disabled={isAdding}
                          >
                            <MessageCircle className="h-4 w-4" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleFriendAction}
                            disabled={isAdding}
                          >
                            <UserMinus className="h-4 w-4" />
                            Unfriend
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant={getFriendActionVariant()}
                          className={getFriendActionClassName()}
                          onClick={handleFriendAction}
                          disabled={isAdding}
                        >
                          {getFriendActionIcon()}
                          {getFriendActionLabel()}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-700 sm:pl-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {profile.postsCount}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wide font-medium">
                    Posts
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {profile.friendsCount}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wide font-medium">
                    Friends
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Section */}
        <div className="mt-6 space-y-4">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="posts">
                Posts ({profile.postsCount})
              </TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
                  <CardContent className="p-8 text-center">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      No posts yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31]">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    About
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QRCodeBlock
                    title="Profile QR"
                    description="Scan to open this profile on another device."
                    value={profileUrl}
                    size={250}
                  />

                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Bio
                    </label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50 mt-1">
                      {profile.user.bio || "No bio provided"}
                    </p>
                  </div>

                  {profile.user.location && (
                    <div>
                      <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Location
                      </label>
                      <p className="text-sm text-zinc-900 dark:text-zinc-50 mt-1">
                        {profile.user.location}
                      </p>
                    </div>
                  )}

                  {profile.user.website && (
                    <div>
                      <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Website
                      </label>
                      <a
                        href={`https://${profile.user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-500 hover:underline mt-1"
                      >
                        {profile.user.website}
                      </a>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Joined
                    </label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50 mt-1">
                      {new Date(profile.user.joinDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Friends
                    </label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50 mt-1">
                      {profile.friendsCount} friends
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
