"use client";

import Link from "next/link";
import { Mail, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/user-avatar";
import { getAllMockUsers } from "./mock-profile-data";

interface UsersListProps {
  currentUserId?: string;
}

export const UsersList = ({ currentUserId }: UsersListProps) => {
  const users = getAllMockUsers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Users
          </h2>
        </div>

        <Link href="/friend-requests">
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Friend Requests
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className="border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#2b2d31] hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <UserAvatar
                  src={user.imageUrl}
                  className="h-12 w-12 ring-2 ring-indigo-200 dark:ring-indigo-900/50"
                />
                <div
                  className={`h-3 w-3 rounded-full ${
                    user.status === "online"
                      ? "bg-green-500"
                      : user.status === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                  }`}
                />
              </div>

              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                {user.name}
              </h3>

              {user.bio && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                  {user.bio}
                </p>
              )}

              <Link href={`/profile/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
