import { redirect } from "next/navigation";

import { UsersList } from "@/components/profile/users-list";
import { currentProfile } from "@/services/current-profile";

const UsersPageRoute = async () => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/70 dark:bg-[#313338]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <UsersList currentUserId={profile.id} />
      </div>
    </div>
  );
};

export default UsersPageRoute;
