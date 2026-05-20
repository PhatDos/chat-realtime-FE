"use client";

import { useState } from "react";
import {
  Home,
  MoreHorizontal,
  Search,
  Users,
} from "lucide-react";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_22%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_46%,_#e4e4e7_100%)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_#0a0a0b_0%,_#111113_45%,_#18181b_100%)] dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

          <div className="relative hidden flex-1 max-w-xl md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="h-11 w-full rounded-full border border-zinc-200/80 bg-zinc-50/90 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-950/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:bg-white/8 dark:focus:ring-white/10"
              placeholder="Search friendly"
            />
          </div>

          <nav className="ml-auto flex items-center gap-1.5">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white">
              <Home className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white">
              <Users className="h-5 w-5" />
            </button>
            <NotificationBell />
            <div className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-zinc-200 ring-2 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-800 dark:ring-white/10">
              <img src={currentUser.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
          <main className="space-y-6">
            <section className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1c1c20]/85">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-zinc-200 dark:border-white/10 dark:bg-zinc-800">
                  <img src={currentUser.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Create a post</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Share an update with your circle.</p>
                </div>
                <button className="hidden h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/10 sm:flex">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <CreatePostBox author={currentUser} onCreated={setLatestCreatedPost} />
              </div>
            </section>

            <FeedList profileId={currentUser.id} newPost={latestCreatedPost} />
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              <FriendList />
            </div>
          </aside>
        </div>

        <div className="mt-6 lg:hidden">
          <FriendList />
        </div>
      </div>
    </div>
  );
};