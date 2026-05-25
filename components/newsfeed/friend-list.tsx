"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/user-avatar";
import { usePresence } from "@/hooks/use-presence";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "../common/loading-overlay";
import { UserMinus, MessageCircle } from "lucide-react";

import { unfriend } from "@/services/friends-client-service";

interface Friend {
  id: string;
  profileId: string;
  name: string;
  imageUrl: string;
  isOnline: boolean;
}

interface FriendListResponse {
  items: Friend[];
  count: number;
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T;
  message?: string;
  timestamp?: string;
}

interface FriendListProps {
  friends?: Friend[];
}

export const FriendList = ({ friends: initialFriends }: FriendListProps) => {
  const [friends, setFriends] = useState<Friend[]>(initialFriends || []);
  const [loading, setLoading] = useState(!initialFriends);
  const [error, setError] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  const apiClient = useApiClient();
  const router = useRouter();
  const { toast } = useToast();
  const profileIds = friends.map((f) => f.profileId);
  const { presence } = usePresence(profileIds);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    if (initialFriends) return; // Skip if already provided

    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<FriendListResponse>>("/friends");
        setFriends(response.data.items || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load friends";
        setError(message);
        console.error("Failed to fetch friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [apiClient, initialFriends]);

  const onlineFriends = friends.filter((f) =>
    presence.hasOwnProperty(f.profileId) ? presence[f.profileId] : f.isOnline
  );
  const totalFriends = friends.length;
  const onlineCount = onlineFriends.length;

  const handleOpenDirectMessage = (profileId: string) => {
    startTransition(() => {
      void router.push(`/conversations/${profileId}`);
    });
  };

  const handleRemoveFriend = async (profileId: string, name: string) => {
    if (removingFriendId) return;

    try {
      setRemovingFriendId(profileId);
      await unfriend(apiClient, profileId);
      setFriends((current) => current.filter((friend) => friend.profileId !== profileId));
      toast({
        title: "Friend removed",
        description: `You are no longer friends with ${name}`,
        variant: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove friend";
      toast({
        title: "Cannot remove friend",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRemovingFriendId(null);
    }
  };

  return (
    <div className="sticky top-20 h-fit space-y-4">
      <LoadingOverlay isLoading={isPending} text="Opening conversation..." />
      <Card className="rounded-[1.5rem] border border-white/70 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1c1c20]/85">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span>Servers you may want to join</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Explore</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: "srv1", name: "Study Group", imageUrl: "/server-default.svg" },
            { id: "srv2", name: "Design Club", imageUrl: "/server-default.svg" },
            { id: "srv3", name: "Gaming Hub", imageUrl: "/server-default.svg" },
          ].map((server) => (
            <Link key={server.id} href={`/servers/${server.id}`}>
              <div className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-zinc-100/80 dark:hover:bg-white/5">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <img src={server.imageUrl} alt="" className="h-6 w-6 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{server.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active topics · popular</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-200 dark:hover:bg-white/10"
                  onClick={(e) => e.preventDefault()}
                >
                  Join
                </Button>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border border-white/70 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1c1c20]/85">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span>Friends</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {onlineCount}/{totalFriends} online
            </span>
          </CardTitle>
          <div className="mt-2 flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-white/5">
              Total {totalFriends}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
              Online {onlineCount}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading friends...</p>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : friends.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">No friends yet</p>
          ) : (
            friends.map((friend) => (
              <Link key={friend.id} href={`/profile/${friend.profileId}`}>
                <div className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-zinc-100/80 dark:hover:bg-white/5">
                  <div className="relative">
                    <UserAvatar
                      src={friend.imageUrl}
                      className="h-9 w-9"
                      isOnline={
                        presence.hasOwnProperty(friend.profileId)
                          ? presence[friend.profileId]
                          : friend.isOnline
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {friend.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {presence.hasOwnProperty(friend.profileId)
                        ? presence[friend.profileId]
                          ? "Active now"
                          : "Offline"
                        : friend.isOnline
                        ? "Active now"
                        : "Offline"}
                    </p>
                  </div>
                  <div
                    className="flex gap-1 opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 rounded-full p-0"
                      title="Send message"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleOpenDirectMessage(friend.profileId);
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 rounded-full p-0"
                      title="Remove friend"
                      disabled={removingFriendId === friend.profileId}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleRemoveFriend(friend.profileId, friend.name);
                      }}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div className="px-4 py-3 text-center">
        <p className="text-xs leading-relaxed text-gray-400">
          About &middot; Help &middot; Privacy &middot; Terms
        </p>
        <p className="mt-2 text-xs text-gray-400">&copy; 2026 NewsFeed</p>
      </div>
    </div>
  );
};
