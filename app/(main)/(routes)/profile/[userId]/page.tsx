import { redirect } from "next/navigation";

import { ProfilePage } from "@/components/profile/profile-page";
import { getMockProfile } from "@/components/profile/mock-profile-data";
import { currentProfile } from "@/services/current-profile";
import { fetchWithAuth } from "@/lib/server-api-client";
import type { UserProfileDto, FriendResponseDto } from "@/types/api/user";
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

  let userProfile: MockProfile;

  try {
    const [userResp, friendResp, postsResp] = await Promise.all([
      fetchWithAuth((client, config) =>
        client.get<UserProfileDto>(`/users/${userId}`, { ...config })
      ),
      fetchWithAuth((client, config) =>
        client.get<FriendResponseDto>(`/users/${userId}/friend`, { ...config })
      ),
      fetchWithAuth((client, config) =>
        client.get<{ items: FeedPost[]; nextCursor: string | null }>(
          `/users/${userId}/posts`,
          { params: { limit: 20 }, ...config }
        )
      ),
    ]);

    userProfile = mapBackendToProfile(
      userResp.data,
      friendResp.data.isFriend,
      postsResp.data.items || []
    );
  } catch (error) {
    // Fallback to mock data if API fails
    console.error("Failed to fetch user profile:", error);
    userProfile = getMockProfile(userId);
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/70 dark:bg-[#313338]">
      <ProfilePage profile={userProfile} currentUserId={profile.id} />
    </div>
  );
};

export default ProfileRoutePage;
