"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/use-api-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "@clerk/nextjs";
import { joinServerByInviteCode } from "@/services/servers/servers-service";

// interface IServer {
//   id: string;
//   name: string;
// }

const InviteCodePage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const params = useParams();
  const router = useRouter();
  const api = useApiClient();
  const { toast } = useToast();
  const inviteCode = params?.inviteCode as string;
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const redirectUrl = encodeURIComponent(`/invite/${inviteCode}`);
      router.push(`/sign-in?redirect_url=${redirectUrl}`);
      return;
    }

    // Prevent duplicate requests
    if (hasJoinedRef.current) return;

    const joinServer = async () => {
      hasJoinedRef.current = true;
      try {
        const server = await joinServerByInviteCode(api, inviteCode);
        toast.server.successJoin(server.name);
        router.push(`/servers/${server.id}`);
      } catch (error) {
        const err = error as AxiosError<{ message: string }>;

        if (err.response?.status === 404) {
          // Invalid invite code
          toast.server.errorJoinInvalidInvite(err.response?.data?.message);
          router.push("/newsfeed");
        } else {
          // Other errors
          toast.server.errorJoin(err.response?.data?.message);
          router.push("/newsfeed");
        }
      }
    };

    if (inviteCode) {
      joinServer();
    } else {
      router.push("/");
    }
  }, [inviteCode, api, router, toast, isLoaded, isSignedIn]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white animate-pulse">
            Joining Server
          </h2>
          <p className="text-purple-300 text-sm">
            Please wait while we prepare your access...
          </p>
        </div>
        <div className="flex justify-center gap-1">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" />
          <div
            className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default InviteCodePage;
