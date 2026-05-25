"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import { ServerWithMembersWithProfiles } from "@/types";
import { ScrollArea } from "../ui/scroll-area";
import { ProfileHoverCard } from "../common/profile-hover-card";
import {
  Check,
  Gavel,
  Loader2,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberRole } from "@/types/api/member";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/use-api-client";
import { changeMemberRole, kickMember } from "@/services/members-client-service";

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.VICESERVEROWNER]: (
    <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />
  ),
  [MemberRole.SERVEROWNER]: <ShieldAlert className="h-4 w-4 text-rose-500" />,
};
export const MembersModal = () => {
  const router = useRouter();
  const api = useApiClient();
  const { onOpen, isOpen, onClose, type, data } = useModal();
  const [loadingId, setLoadingId] = useState("");
  const isModalOpen = isOpen && type === "members";
  const { server } = data as { server: ServerWithMembersWithProfiles };

  const onKick = async (memberId: string) => {
    try {
      setLoadingId(memberId);
      const response = await kickMember(api, memberId, server?.id as string);
      router.refresh();
      onOpen("members", { server: response });
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingId("");
    }
  };
  const onRoleChange = async (memberId: string, role: MemberRole) => {
    try {
      setLoadingId(memberId);
      const response = await changeMemberRole(
        api,
        memberId,
        server?.id as string,
        role,
      );

      router.refresh();
      onOpen("members", { server: response });
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingId("");
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black text-white overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Manage member
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 italic">
            {server?.members?.length} members
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {server?.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-x-2 mb-6">
              <ProfileHoverCard
                id={member.profileId}
                name={member.profile.name}
                imageUrl={member.profile.imageUrl}
                currentProfileId={server.profileId}
              />
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1">
                  {member.profile.name}
                  {roleIconMap[member.role]}
                </div>
                <p className="text-xs text-zinc-500">{member.profile.email}</p>
              </div>
              {server.profileId !== member.profileId &&
                loadingId !== member.id && (
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center hover:cursor-pointer">
                            <ShieldQuestion className="w-4 h-4 mr-2" />
                            <span>Role</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="bg-black">
                              <DropdownMenuItem
                                onClick={() =>
                                  onRoleChange(member.id, MemberRole.GUEST)
                                }
                                className="hover:cursor-pointer"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Guest
                                {member.role === MemberRole.GUEST && (
                                  <Check className="h-4 w-4 ml-auto" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onRoleChange(
                                    member.id,
                                    MemberRole.VICESERVEROWNER,
                                  )
                                }
                                className="hover:cursor-pointer"
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Vice Server Owner
                                {member.role ===
                                  MemberRole.VICESERVEROWNER && (
                                  <Check className="h-4 w-4 ml-auto" />
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator className="bg-gray-500" />
                        <DropdownMenuItem
                          onClick={() => onKick(member.id)}
                          className="hover:cursor-pointer text-red-500"
                        >
                          <Gavel className="h-4 w-4 mr-2 text-rose-600" />
                          Kick
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              {loadingId === member.id && (
                <Loader2 className="animate-spin text-zinc-500 ml-auto w-4 h-4" />
              )}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
