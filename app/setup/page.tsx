import { InitialModal } from "@/components/modals/initial-modal";
import { redirect } from "next/navigation";
import { getInitialServer } from "@/services/servers/servers-ssr-service";
import { initialProfile } from "@/lib/intial-profile";

const SetupPage = async () => {
  await initialProfile();

  const initial = await getInitialServer();

  const serverId = initial?.server?.id;
  const channelId =
    initial?.server?.generalChannelId ?? initial?.initialChannel?.channelId ?? null;

  if (serverId && channelId) {
    return redirect(`/servers/${serverId}/channels/${channelId}`);
  }

  return <InitialModal />;
};

export default SetupPage;
