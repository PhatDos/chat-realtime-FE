import { redirect } from "next/navigation";

import { NewsFeedPage } from "@/components/newsfeed/news-feed-page";
import { currentProfile } from "@/services/current-profile";

const NewsfeedRoutePage = async () => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/70 dark:bg-[#313338]">
      <NewsFeedPage
        currentUser={{
          id: profile.id,
          name: profile.name,
          imageUrl: profile.imageUrl,
        }}
      />
    </div>
  );
};

export default NewsfeedRoutePage;