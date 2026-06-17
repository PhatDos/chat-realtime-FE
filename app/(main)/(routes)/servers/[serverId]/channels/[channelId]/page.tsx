import { ChatHeader } from "@/components/chat/chat-header";
import { ChannelChatWorkspace } from "@/components/chat/channel-chat/channel-chat-workspace";
import { MediaRoom } from "@/components/ui/media-room";
import { getChannel, getServerMe } from "@/services/servers/servers-ssr-service";
import { ChannelType } from "@/types/api/channel";
import { redirect } from "next/navigation";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
}

type ChannelTab = "messages" | "polls" | "media" | "files";

const getActiveTab = (tab?: string): ChannelTab => {
  if (tab === "polls" || tab === "media" || tab === "files") return tab;

  return "messages";
};

const ChannelIdPage = async ({ params, searchParams }: ChannelIdPageProps) => {
  const { serverId, channelId } = await params;
  const searchParamsData = await searchParams;
  const activeTab = getActiveTab(searchParamsData?.tab);

  const [channelRes, accessRes] = await Promise.all([
    getChannel(serverId, channelId),
    getServerMe(serverId),
  ]).catch(() => redirect("/newsfeed"));

  const channel = channelRes;
  const member = accessRes?.member;

  if (!channel || !member) {
    redirect("/newsfeed");
  }

  return (
    <div className="w-full bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channel.name}
        serverId={channel.serverId}
        channelId={channel.id}
        type="channel"
        activeTab={activeTab}
      />

      {channel.type === ChannelType.TEXT && (
        <ChannelChatWorkspace
          channelId={channel.id}
          serverId={channel.serverId}
          channelName={channel.name}
          member={member}
          apiUrl="/api/messages"
          activeTab={activeTab}
        />
      )}

      {channel.type === ChannelType.AUDIO && (
        <MediaRoom chatId={channel.id} video={false} audio={true} />
      )}
      {channel.type === ChannelType.VIDEO && (
        <MediaRoom chatId={channel.id} video={true} audio={true} />
      )}
    </div>
  );
};

export default ChannelIdPage;
