import { ServerSidebar } from "@/components/server/server-sidebar";
import { fetchWithAuth } from "@/lib/server-api-client";
import { redirect } from "next/navigation";
import { isAxiosError } from "axios";

interface ServerIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    serverId: string;
  }>;
}

const ServerIdLayout = async ({ children, params }: ServerIdLayoutProps) => {
  const { serverId } = await params;

  try {
    await fetchWithAuth((client, config) =>
      client.get(`/servers/${serverId}/me`, config)
    );
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (status === 401) redirect("/sign-in");
    redirect("/newsfeed"); // 403 = not a member, 404 = server gone
  }

  return (
    <div className="flex h-full">
      <div className="hidden md:!flex md:!flex-1 overflow-y-auto">
        <ServerSidebar serverId={serverId} />
      </div>
      <div className="flex-[2]">{children}</div>
    </div>
  );
};

export default ServerIdLayout;
