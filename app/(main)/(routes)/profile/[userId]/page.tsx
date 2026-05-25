import { redirect } from "next/navigation";

import { ProfilePage } from "@/components/profile/profile-page";
import { getMockProfile } from "@/components/profile/mock-profile-data";
import { currentProfile } from "@/services/current-profile";
import { fetchWithAuth } from "@/lib/server-api-client";
import type { UserProfileDto } from "@/types/api/user";
import type { FriendshipInfoDto } from "@/types/api/friendship";
import type { FeedPost } from "@/components/newsfeed/types";
import type { MockProfile } from "@/components/profile/mock-profile-data";

interface ProfileRoutePageProps {
  params: Promise<{ userId: string }>;
}

const mapBackendToProfile = (
  user: UserProfileDto,
  isFriend: boolean,
  posts: FeedPost[]
): MockProfile => {
  return {
    user: {
      id: user.id,
      name: user.name,
      imageUrl: user.imageUrl || "/avatar-default-dark.svg",
      bio: user.bio,
      status: user.isOnline ? "online" : "offline",
      joinDate: user.joinDate || new Date().toISOString(),
      location: user.location,
      website: undefined,
    },
    friendsCount: 0,
    postsCount: posts.length,
    isFriend,
    posts,
  };
};

const ProfileRoutePage = async ({ params }: ProfileRoutePageProps) => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  const { userId } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const profileUrl = `${siteUrl}/profile/${userId}`;

  let userProfile: MockProfile;
  let targetProfileId = userId;

  try {
    const [userResp, friendResp, postsResp] = await Promise.all([
      fetchWithAuth((client, config) =>
        client.get<UserProfileDto>(`/users/${userId}`, { ...config })
      ),
      fetchWithAuth((client, config) =>
        client.get<{ data: FriendshipInfoDto }>(`/profiles/${userId}/friend`, { ...config })
      ),
      fetchWithAuth((client, config) =>
        client.get<{ items: FeedPost[]; nextCursor: string | null }>(
          `/users/${userId}/posts`,
          { params: { limit: 20 }, ...config }
        )
      ),
    ]);

    const friendshipInfo = friendResp.data.data;

    userProfile = mapBackendToProfile(
      userResp.data,
      friendshipInfo.isFriend,
      postsResp.data.items || []
    );
    targetProfileId = friendshipInfo.id || userId;
  } catch (error) {
    // Fallback to mock data if API fails
    console.error("Failed to fetch user profile:", error);
    userProfile = getMockProfile(userId);
    targetProfileId = userId;
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/70 dark:bg-[#313338]">
      <ProfilePage
        profile={userProfile}
        currentUserId={profile.id}
        profileUrl={profileUrl}
        targetProfileId={targetProfileId}
      />
    </div>
  );
};

export default ProfileRoutePage;
