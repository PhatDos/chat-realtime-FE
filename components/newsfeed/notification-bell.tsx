"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NotificationPopoverContent } from "./notification-popover-content";
import { useApiClient } from "@/hooks/use-api-client";
import { useQuery } from "@tanstack/react-query";
import { getIncomingFriendRequestsEnvelope } from "@/services/friends-client-service";

export const NotificationBell = () => {
	const [open, setOpen] = useState(false);
	const api = useApiClient();

	const { data: incomingEnvelope } = useQuery(
		["friend-requests", "incoming", "envelope"],
		async () => {
			return getIncomingFriendRequestsEnvelope(api, { skip: 0, limit: 1 });
		},
		{ staleTime: 1000 * 10 }
	);

	const incomingCount =
		(incomingEnvelope && incomingEnvelope.data?.count) || 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative h-10 w-10 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
					aria-label="Notifications"
				>
					<Bell className="size-6" />
					{incomingCount > 0 && (
						<Badge
							className="absolute -top-1 -right-1 text-white h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-600"
							variant="default"
						>
							{incomingCount > 99 ? "99+" : incomingCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="end">
				<NotificationPopoverContent onClose={() => setOpen(false)} />
			</PopoverContent>
		</Popover>
	);
};

