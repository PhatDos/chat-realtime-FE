"use client";

import { cn } from "@/lib/utils";
import { MemberRole, MemberWithProfileResponse } from "@/types/api/member";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoadingOverlay } from "../common/loading-overlay";
import { ProfileHoverCard } from "../common/profile-hover-card";

interface ServerMemberProps {
  member: MemberWithProfileResponse;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.SERVEROWNER]: (
    <ShieldAlert className="h-4 w-4 ml-2 text-indigo-500" />
  ),
  [MemberRole.VICESERVEROWNER]: (
    <ShieldCheck className="h-4 w-4 ml-2 text-rose-500" />
  ),
};
export const ServerMember = ({ member }: ServerMemberProps) => {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const icon = roleIconMap[member.role];
  const onClick = () => {
    startTransition(() => {
      void router.push(
        `/servers/${params?.serverId}/conversations/${member.profile.id}`,
      );
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1 cursor-pointer text-left",
        params?.memberId === member.profile.id &&
          "bg-zinc-700/50 dark:bg-zinc-700",
      )}
    >
      <LoadingOverlay isLoading={isPending} text="Opening conversation..." />
      <ProfileHoverCard
        id={member.profile.id}
        name={member.profile.name}
        imageUrl={member.profile.imageUrl}
        className="h-8 w-8 md:h-8 md:w-8"
      />
      <p
        className={cn(
          "font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.memberId === member.profile.id &&
            "text-primary dark:text-zinc-200 dark:group-hover:text-white",
        )}
      >
        {member.profile.name}
      </p>
      {icon}
    </div>
  );
};
