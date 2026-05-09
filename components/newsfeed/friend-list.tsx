"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  imageUrl: string;
  status?: "online" | "offline";
}

interface FriendListProps {
  friends?: Friend[];
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "Alice Johnson",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    status: "online",
  },
  {
    id: "2",
    name: "Bob Smith",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    status: "online",
  },
  {
    id: "3",
    name: "Carol Davis",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    status: "offline",
  },
  {
    id: "4",
    name: "David Wilson",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    status: "online",
  },
  {
    id: "5",
    name: "Emma Brown",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    status: "offline",
  },
  {
    id: "6",
    name: "Frank Miller",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
    status: "online",
  },
];

export const FriendList = ({ friends = MOCK_FRIENDS }: FriendListProps) => {
  const onlineFriends = friends.filter((f) => f.status === "online");

  return (
    <div className="sticky top-20 h-fit space-y-4">
      <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white/95 dark:bg-[#2b2d31]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Friends ({onlineFriends.length} online)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition group"
            >
              <div className="relative">
                <UserAvatar src={friend.imageUrl} className="h-9 w-9" />
                <div
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#2b2d31] ${
                    friend.status === "online"
                      ? "bg-green-500"
                      : "bg-zinc-400"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  {friend.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {friend.status === "online" ? "Active now" : "Offline"}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title="Send message"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title="Add friend"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-700/70 bg-white/95 dark:bg-[#2b2d31]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { id: "s1", name: "Sarah Anderson", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
            { id: "s2", name: "James Taylor", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
            { id: "s3", name: "Lisa White", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" },
          ].map((suggestion) => (
            <div key={suggestion.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition">
              <UserAvatar src={suggestion.imageUrl} className="h-8 w-8" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  {suggestion.name}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                Add
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
