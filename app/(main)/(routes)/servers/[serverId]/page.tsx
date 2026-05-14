import { currentProfile } from "@/services/current-profile";
import { getServerSidebarData } from "@/services/servers/servers-ssr-service";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>;
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/sign-in");
  }

  const { serverId } = await params;

  const sidebarData = await getServerSidebarData(serverId);

  const channelId =
    sidebarData?.server?.generalChannelId ??
    sidebarData?.textChannels?.[0]?.id ??
    sidebarData?.server?.channels?.find((c) => c.name === "general")?.id ??
    null;

  if (!channelId) {
    // nothing to redirect to — keep user on server root
    return null;
  }

  return redirect(`/servers/${serverId}/channels/${channelId}`);
};

export default ServerIdPage;
