"use client";

import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActionTooltip } from "../common/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";

export const NavigationAction = () => {
    const { onOpen } = useModal();
    const router = useRouter();
    return (
        <div>
            <ActionTooltip side="right" align="center" label="Add a server">
                <button
                    onClick={() => onOpen("createServer")}
                    className="group flex items-center"
                >
                    <div className="flex mx-3 h-[48px] w-[48px] items-center justify-center 
                    rounded-[24px] group-hover:rounded-[16px] transition-all 
                    overflow-hidden bg-gray-100 
                    dark:bg-neutral-700 group-hover:bg-emerald-500">
                        <Plus
                            className="group-hover:text-white transition 
                            text-emerald-500"
                            size={25}
                        />
                    </div>
                </button>
            </ActionTooltip>

            <ActionTooltip side="right" align="center" label="Discover servers">
                <button
                    onClick={() => router.push("/servers")}
                    className="group flex items-center"
                >
                    <div className="mt-2 flex mx-3 h-[48px] w-[48px] items-center justify-center 
                    rounded-[24px] group-hover:rounded-[16px] transition-all 
                    overflow-hidden bg-gray-100 
                    dark:bg-neutral-700 group-hover:bg-sky-500">
                        <Search
                            className="group-hover:text-white transition 
                            text-sky-500"
                            size={22}
                        />
                    </div>
                </button>
            </ActionTooltip>
        </div>
    )
}