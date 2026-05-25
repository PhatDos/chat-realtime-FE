import { redirect } from "next/navigation";

import { currentProfile } from "@/services/current-profile";
import { ServerDiscoveryPage } from "@/components/servers/server-discovery-page";

const ServersDiscoveryRoutePage = async () => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return <ServerDiscoveryPage />;
};

export default ServersDiscoveryRoutePage;