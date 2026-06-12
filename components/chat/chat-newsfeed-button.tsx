"use client";

import { useRouter } from "next/navigation";
import { Newspaper } from "lucide-react";
import { ActionTooltip } from "../common/action-tooltip";
import { useTransition } from "react";
import { LoadingOverlay } from "../common/loading-overlay";

export const ChatNewsfeedButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(() => {
      void router.push("/newsfeed");
    });
  };

  return (
    <>
      <ActionTooltip side="bottom" label="Open Newsfeed">
        <button
          onClick={onClick}
          disabled={isPending as unknown as boolean}
          className={`mr-3 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:scale-110 active:scale-95 ${
            isPending ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' : 'hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
        >
          <Newspaper className="h-5 w-5" />
        </button>
      </ActionTooltip>
      <LoadingOverlay isLoading={isPending as unknown as boolean} text="Opening newsfeed..." />
    </>
  );
};
