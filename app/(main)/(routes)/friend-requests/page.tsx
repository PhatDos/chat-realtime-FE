import { redirect } from "next/navigation";

import { FriendRequestsPage } from "@/components/profile/friend-requests-page";
import { currentProfile } from "@/services/current-profile";

const FriendRequestsRoutePage = async () => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/70 dark:bg-[#313338]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FriendRequestsPage />
      </div>
    </div>
  );
};

export default FriendRequestsRoutePage;
