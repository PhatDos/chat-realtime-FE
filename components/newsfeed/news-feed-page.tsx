"use client";

import { useState } from "react";

import { CreatePostBox } from "./create-post-box";
import { FeedList } from "./feed-list";
import { FriendList } from "./friend-list";
import { NotificationBell } from "./notification-bell";
import { FeedAuthor, FeedPost } from "./types";

interface NewsFeedPageProps {
  currentUser: FeedAuthor;
}

export const NewsFeedPage = ({ currentUser }: NewsFeedPageProps) => {
  const [latestCreatedPost, setLatestCreatedPost] = useState<FeedPost | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Newsfeed
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Infinite scroll, optimistic likes, and realtime prepended posts.
            </p>
          </div>
          {/* <NotificationBell incomingRequestsCount={2} /> */}
          <NotificationBell />
        </div>

        {/* Main Layout - 70:30 Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Center - Feed (70%) */}
          <div className="lg:col-span-7 space-y-4">
            <CreatePostBox author={currentUser} onCreated={setLatestCreatedPost} />
            <FeedList profileId={currentUser.id} newPost={latestCreatedPost} />
          </div>

          {/* Right Side - Friend List (30%) */}
          <div className="lg:col-span-3">
            <FriendList />
          </div>
        </div>

        {/* Mobile Friend List - Below feed on small screens */}
        <div className="lg:hidden mt-6">
          <FriendList />
        </div>
      </div>
    </div>
  );
};