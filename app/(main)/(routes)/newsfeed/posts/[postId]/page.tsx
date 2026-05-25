import { redirect } from "next/navigation";

import { currentProfile } from "@/services/current-profile";
import { getPost } from "@/services/newsfeed-ssr-service";
import { PostDetailPage } from "@/components/newsfeed/post-detail-page";

interface PostDetailRouteProps {
  params: Promise<{
    postId: string;
  }>;
}

const PostDetailRoutePage = async ({ params }: PostDetailRouteProps) => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  const { postId } = await params;

  try {
    const post = await getPost(postId);

    return <PostDetailPage currentUserId={profile.id} initialPost={post} />;
  } catch {
    redirect("/newsfeed");
  }
};

export default PostDetailRoutePage;