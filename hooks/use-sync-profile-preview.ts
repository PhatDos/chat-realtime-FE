import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface ProfilePreview {
  id: string;
  name: string;
  imageUrl?: string;
}

export const profilePreviewQueryKey = (profileId: string) => ["profile-preview", profileId];

export const useSyncProfilePreview = (profile: ProfilePreview | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile?.id) return;

    queryClient.setQueryData(profilePreviewQueryKey(profile.id), {
      id: profile.id,
      name: profile.name,
      imageUrl: profile.imageUrl,
    });
  }, [profile?.id, profile?.imageUrl, profile?.name, queryClient]);
};
