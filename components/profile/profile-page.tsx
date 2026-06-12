"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
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
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendshipInfo,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
} from "@/services/friends-client-service";

import { FeedPost } from "@/components/newsfeed/types";

export interface MockUser {
  id: string;
  name: string;
  imageUrl: string;
  bio?: string;
  status: "online" | "offline" | "away";
  joinDate: string;
  location?: string;
  website?: string;
}

export interface MockProfile {
  user: MockUser;
  friendsCount: number;
  postsCount: number;
  isFriend: boolean;
  posts: FeedPost[];
}

interface ProfilePageProps {
  profile: MockProfile;
  currentUserId: string;
  profileUrl: string;
  targetProfileId: string;
}

export const ProfilePage = ({ profile, currentUserId, profileUrl, targetProfileId }: ProfilePageProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isFriend, setIsFriend] = useState(profile.isFriend);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [pendingRequestDirection, setPendingRequestDirection] = useState<"sent" | "received" | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>(profile.posts);
  const [friendsCount, setFriendsCount] = useState(profile.friendsCount);
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refetchNotificationContent = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming"] }),
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] }),
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "incoming", "envelope"] }),
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
    ]);
  };

  const isOwnProfile = targetProfileId === currentUserId;

  useEffect(() => {
    setFriendsCount(profile.friendsCount);
  }, [profile.user.id, profile.friendsCount]);

  useEffect(() => {
    const loadFriendshipInfo = async () => {
      if (isOwnProfile) {
        return;
      }

      try {
        const friendshipInfo = await getFriendshipInfo(api, targetProfileId);
        setIsFriend(friendshipInfo.isFriend);
        setPendingRequestId(friendshipInfo.pendingRequest?.id ?? null);
        setPendingRequestDirection(friendshipInfo.pendingRequest?.direction ?? null);
      } catch {
        setIsFriend(profile.isFriend);
        setPendingRequestId(null);
        setPendingRequestDirection(null);
      }
    };

    void loadFriendshipInfo();
  }, [api, isOwnProfile, profile.isFriend, targetProfileId]);

  const handleAddFriend = async () => {
    if (isAdding || isFriend || pendingRequestId) {
      return;
    }

    try {
      setIsAdding(true);
      const request = await sendFriendRequest(api, targetProfileId);
      setPendingRequestId(request.id ?? null);
      setPendingRequestDirection("sent");
      setIsFriend(false);

      await refetchNotificationContent();

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
      setPendingRequestDirection(null);

      await refetchNotificationContent();

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
      setPendingRequestId(null);
      setPendingRequestDirection(null);
      setFriendsCount((prev) => Math.max(0, prev - 1));

      await refetchNotificationContent();

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
      return pendingRequestDirection === "received" ? "Respond" : "Cancel Request";
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
    if (pendingRequestDirection === "received") {
      return;
    }

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

  const handleAcceptRequest = async () => {
    if (isAdding || !pendingRequestId || pendingRequestDirection !== "received") {
      return;
    }

    try {
      setIsAdding(true);
      await acceptFriendRequest(api, pendingRequestId);
      setPendingRequestId(null);
      setPendingRequestDirection(null);
      setIsFriend(true);
      setFriendsCount((prev) => prev + 1);

      await refetchNotificationContent();

      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${profile.user.name}`,
        variant: "success",
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        title: "Cannot accept request",
        description:
          err.response?.data?.message ??
          "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRejectRequest = async () => {
    if (isAdding || !pendingRequestId || pendingRequestDirection !== "received") {
      return;
    }

    try {
      setIsAdding(true);
      await rejectFriendRequest(api, pendingRequestId);
      setPendingRequestId(null);
      setPendingRequestDirection(null);

      await refetchNotificationContent();

      toast({
        title: "Friend request rejected",
        description: `You rejected ${profile.user.name}'s request`,
        variant: "success",
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        title: "Cannot reject request",
        description:
          err.response?.data?.message ??
          "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_32%),_radial-gradient(circle_at_top_right,_rgba(236,72,153,0.08),_transparent_32%),_linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_32%),_radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_32%),_linear-gradient(180deg,_#0f0f11_0%,_#18181b_100%)] pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="h-48 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 dark:from-violet-950 dark:via-indigo-900 dark:to-cyan-950 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 opacity-30 backdrop-blur-[2px]" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-500/20 dark:bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      {/* Profile Info Card */}
      <div className="max-w-4xl mx-auto px-4 relative">
        <Card className="border border-white/60 dark:border-zinc-800 bg-white/70 dark:bg-[#1e1f22]/85 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-[2rem] -mt-16">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
              {/* Avatar */}
              <div className="relative -mt-20 sm:-mt-24 z-10 flex justify-center sm:justify-start">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-30 group-hover:opacity-100 transition duration-500" />
                  <UserAvatar
                    src={profile.user.imageUrl}
                    className="!h-32 !w-32 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white dark:border-[#1e1f22] z-20 ${getStatusColor(
                      profile.user.status
                    )}`}
                  />
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
                <div className="text-center sm:text-left space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {profile.user.name}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(profile.user.status)}`} />
                      {getStatusText(profile.user.status)}
                    </span>
                  </div>

                  {profile.user.bio && (
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 max-w-xl">
                      {profile.user.bio}
                    </p>
                  )}

                  {/* User Info */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      <span>
                        Joined{" "}
                        {new Date(profile.user.joinDate).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long" }
                        )}
                      </span>
                    </div>

                    {profile.user.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <span>{profile.user.location}</span>
                      </div>
                    )}

                    {profile.user.website && (
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <a
                          href={`https://${profile.user.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:text-indigo-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {profile.user.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center sm:justify-start mt-4">
                    {isOwnProfile ? (
                      <></>
                    ) : (
                      <>
                        {isFriend ? (
                          <>
                            <Button
                              variant="default"
                              className="gap-2 rounded-full px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition duration-200 active:scale-95"
                              disabled={isAdding}
                            >
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2 rounded-full px-5 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition duration-200 active:scale-95 text-red-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900"
                              onClick={handleFriendAction}
                              disabled={isAdding}
                            >
                              <UserMinus className="h-4 w-4" />
                              Unfriend
                            </Button>
                          </>
                        ) : pendingRequestDirection === "received" ? (
                          <>
                            <Button
                              variant="default"
                              className="gap-2 rounded-full px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition duration-200 active:scale-95"
                              onClick={handleAcceptRequest}
                              disabled={isAdding}
                            >
                              <UserCheck className="h-4 w-4" />
                              Accept Request
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2 rounded-full px-5 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition duration-200 active:scale-95 text-red-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900"
                              onClick={handleRejectRequest}
                              disabled={isAdding}
                            >
                              <UserMinus className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant={getFriendActionVariant()}
                            className={`gap-2 rounded-full px-5 font-semibold transition duration-200 active:scale-95 ${
                              pendingRequestId
                                ? "border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"
                                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
                            }`}
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
                <div className="flex gap-6 justify-center sm:justify-end py-2.5 px-5 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/30 backdrop-blur-sm shadow-sm">
                  <div className="text-center min-w-[70px]">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {profile.postsCount}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Posts
                    </div>
                  </div>
                  <div className="text-center min-w-[70px] border-l border-zinc-200 dark:border-zinc-800 pl-6">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {friendsCount}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Friends
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts & About Section */}
        <div className="mt-8 space-y-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-200/50 dark:bg-zinc-800/40 p-1.5 rounded-2xl border border-zinc-200/20 dark:border-zinc-700/20">
              <TabsTrigger value="posts" className="rounded-xl font-bold py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-[#2b2d31] data-[state=active]:shadow-md">
                Posts ({profile.postsCount})
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-xl font-bold py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-[#2b2d31] data-[state=active]:shadow-md">
                About
              </TabsTrigger>
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
                <Card className="border border-white/60 dark:border-zinc-800 bg-white/70 dark:bg-[#1e1f22]/85 backdrop-blur-md rounded-2xl shadow-sm">
                  <CardContent className="p-12 text-center">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      No posts yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
                {/* Left details column */}
                <div className="space-y-6">
                  <Card className="border border-white/60 dark:border-zinc-800 bg-white/70 dark:bg-[#1e1f22]/85 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        Personal Information
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Bio
                        </span>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">
                          {profile.user.bio || "No bio provided"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                        {profile.user.location && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Location
                            </span>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1">
                              {profile.user.location}
                            </p>
                          </div>
                        )}

                        {profile.user.website && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Website
                            </span>
                            <div className="mt-1">
                              <a
                                href={`https://${profile.user.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                              >
                                {profile.user.website}
                              </a>
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Joined Since
                          </span>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1">
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
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Network
                          </span>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1">
                            {friendsCount} friends
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right QR card column */}
                <div>
                  <Card className="border border-white/60 dark:border-zinc-800 bg-white/70 dark:bg-[#1e1f22]/85 backdrop-blur-md rounded-2xl shadow-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/20 dark:border-zinc-700/20 mb-4">
                      <QRCodeBlock
                        title="Profile QR"
                        description="Scan to open this profile on another device."
                        value={profileUrl}
                        size={200}
                      />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      Scan or Share Profile
                    </span>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[200px] leading-relaxed">
                      Users can scan this QR code to view this profile directly.
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
