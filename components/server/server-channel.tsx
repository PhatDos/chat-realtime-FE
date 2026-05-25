"use client"

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { ChannelResponse as Channel, ChannelType } from "@/types/api/channel";
import { MemberRole } from "@/types/api/member";
import { ServerResponse as Server } from "@/types/api/server";
import { Edit, Hash, Lock, Mic, Trash, Video, Bell, BellOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { LoadingOverlay } from "../common/loading-overlay";
import { ActionTooltip } from "../common/action-tooltip";
import { ModalType, useModal } from "@/hooks/use-modal-store";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { updateChannelNotify } from "@/services/channels-service";
import { useChannelSwitchStore } from "@/hooks/use-channel-switch-store";

interface ServerChannelProps {
    channel: Channel;
    server: Server;
    role?: MemberRole
    unreadCount?: number;
}

const iconMap = {
    [ChannelType.TEXT]: Hash,
    [ChannelType.AUDIO]: Mic,
    [ChannelType.VIDEO]: Video
}

export const ServerChannel = ({
    channel,
    server,
    role,
    unreadCount = 0
}: ServerChannelProps) => {
    const [isNotify, setIsNotify] = useState(true);
    const [isUpdatingNoti, setIsUpdatingNoti] = useState(false);
    const apiClient = useApiClient();
    const { toast } = useToast();
    const {onOpen} = useModal();
    const { startSwitchingChannel } = useChannelSwitchStore();
    const params = useParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startSwitchingChannel(channel.id);
        startTransition(() => {
            void router.push(`/servers/${params?.serverId}/channels/${channel.id}`);
        });
    }

    const onAction = (e: React.MouseEvent, action: ModalType) => {
        e.stopPropagation();
        onOpen(action, {channel, server});
    }

    const onToggleNoti = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUpdatingNoti) return;

        try {
            setIsUpdatingNoti(true);
            const channelRead = await updateChannelNotify(apiClient, channel.id, {
                serverId: server.id,
                isNotify: !isNotify,
            });

            setIsNotify(channelRead.isNotify);
        } catch (error) {
            console.error("Failed to update channel notification setting:", error);
            toast.channel.errorUpdateNotification();
        } finally {
            setIsUpdatingNoti(false);
        }
    }

    const Icon = iconMap[channel.type];

    return (
        <button
            onClick={onClick}
            className={cn(
                "group py-2 px-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
                params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700"
            )}
        >
            <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400"/>
            <p className={cn(
                "line-clamp-1 font-semibold text-xs text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
                params?.channelId === channel.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
            )}>
                {channel.name}
            </p>
            {channel.name === "general" && (
                <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
            )}
            {channel.name !== "general" && role !== MemberRole.GUEST && (
                <div className="flex items-center gap-x-2 ml-3">
                    <ActionTooltip label="Edit">
                        <Edit 
                            onClick={(e) => onAction(e,"editChannel")}
                            className="hidden group-hover:block w-4 h-4 
                            text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 
                            dark:hover:text-zinc-300 transition"
                        />
                    </ActionTooltip>
                    <ActionTooltip label="Delete">
                        <Trash 
                            onClick={(e) => onAction(e, "deleteChannel")}
                            className="hidden group-hover:block w-4 h-4 
                            text-rose-600 hover:text-rose-500 dark:text-rose-600 
                            dark:hover:text-rose-500 transition"
                        />
                    </ActionTooltip>
                </div>
            )}
            {channel.type === ChannelType.TEXT && (
                <ActionTooltip label="turn off notification">
                    {isNotify ? (
                        <Bell
                            onClick={onToggleNoti}
                            className={cn(
                                "hidden group-hover:block w-4 h-4 text-yellow-500 hover:text-yellow-400 dark:text-yellow-500 dark:hover:text-yellow-400 transition",
                                isUpdatingNoti && "pointer-events-none opacity-50"
                            )}
                        />
                    ) : (
                        <BellOff
                            onClick={onToggleNoti}
                            className={cn(
                                "hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition",
                                isUpdatingNoti && "pointer-events-none opacity-50"
                            )}
                        />
                    )}
                </ActionTooltip>
            )}
            
            {unreadCount > 0 && (
                <div className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </div>
            )}
            <LoadingOverlay isLoading={isPending} text="Switching channel..." />
        </button>
    )
}