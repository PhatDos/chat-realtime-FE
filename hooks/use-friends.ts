import { useEffect, useState } from "react";
import { useApiClient } from "./use-api-client";

export interface Friend {
  id: string;
  profileId: string;
  name: string;
  imageUrl: string;
  status?: "online" | "offline";
}

interface FriendsResponse {
  status: boolean;
  code: number;
  data: {
    items: Array<{
      id: string;
      profileId: string;
      name: string;
      imageUrl: string;
    }>;
    count: number;
  };
  message: string;
  timestamp: string;
}

export const useFriends = () => {
  const apiClient = useApiClient();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<FriendsResponse>("/friends");

        if (data.status && data.data?.items) {
          setFriends(data.data.items);
          setError(null);
        } else {
          setError(data.message || "Failed to fetch friends");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch friends");
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [apiClient]);

  return { friends, loading, error };
};
