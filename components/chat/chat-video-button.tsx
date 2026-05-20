"use client";


import qs from "query-string";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LoadingOverlay } from "../common/loading-overlay";
import { Video, VideoOff } from "lucide-react";

import { ActionTooltip } from "../common/action-tooltip";

export const ChatVideoButton = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVideo = searchParams?.get("video");
    const [isPending, startTransition] = useTransition();
    const Icon = isVideo ? VideoOff : Video;
    const onClick = () => {
        const url = qs.stringifyUrl({
            url: pathname || "",
            query: {
                video: isVideo ? undefined : true,
            }
        }, {skipNull: true});

        startTransition(() => {
            void router.push(url);
        });
    }
    const tooltipLabel = isVideo ? "End video call" : "Start video call";

    return (
        <>
        <ActionTooltip
            side="bottom" label={tooltipLabel}
        >
            <button 
                onClick={onClick} 
                className={`mr-4 p-2 rounded-lg transition-all duration-300 ${
                    isVideo 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400' 
                        : 'hover:bg-indigo-500/20 text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400'
                } hover:scale-110 active:scale-95`}
            >
                <Icon className="h-6 w-6"/>
            </button>
        </ActionTooltip>
        <LoadingOverlay isLoading={isPending} text={tooltipLabel} />
        </>
    )
}