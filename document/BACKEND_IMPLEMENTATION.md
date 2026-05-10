# Backend Implementation Quick Start

## Files That Need Implementation

### 1. `lib/sse-broadcaster.ts`
Implement a class to manage SSE connections and broadcast events:

```typescript
type EventListener = (data: string) => void;

export class SSEBroadcaster {
  private profileListeners: Map<string, Set<EventListener>> = new Map();

  subscribe(profileId: string, listener: EventListener): () => void {
    if (!this.profileListeners.has(profileId)) {
      this.profileListeners.set(profileId, new Set());
    }
    const listeners = this.profileListeners.get(profileId)!;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.profileListeners.delete(profileId);
      }
    };
  }

  broadcast(profileId: string, event: Record<string, any>) {
    const data = JSON.stringify(event);
    const listeners = this.profileListeners.get(profileId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("Error sending SSE event:", err);
        }
      });
    }
  }

  broadcastAll(event: Record<string, any>) {
    const data = JSON.stringify(event);
    this.profileListeners.forEach((listeners) => {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("Error sending SSE event:", err);
        }
      });
    });
  }
}

export const sseBroadcaster = new SSEBroadcaster();
```

### 2. `app/api/posts/events/route.ts`
Implement SSE stream endpoint:

```typescript
import { auth } from "@clerk/nextjs/server";
import { sseBroadcaster } from "@/lib/sse-broadcaster";
import { getCurrentProfile } from "@/services/servers/servers-service";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get profile from current user
  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Profile not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = sseBroadcaster.subscribe(profile.id, (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

### 3. Update Like Endpoints
**File**: `app/api/posts/[postId]/like/route.ts` (create if needed)

After saving like to database:
```typescript
import { sseBroadcaster } from "@/lib/sse-broadcaster";

// After successfully creating like
sseBroadcaster.broadcastAll({
  type: "POST_LIKED",
  actionUserId: currentProfile.id,
  postId: post.id,
});
```

**For unlike**:
```typescript
// After successfully deleting like
sseBroadcaster.broadcastAll({
  type: "POST_UNLIKED",
  actionUserId: currentProfile.id,
  postId: post.id,
});
```

### 4. Update Comment Endpoint
After creating comment:
```typescript
import { sseBroadcaster } from "@/lib/sse-broadcaster";

// After comment is saved
sseBroadcaster.broadcastAll({
  type: "COMMENT_ADDED",
  actionUserId: currentProfile.id,
  postId: post.id,
  comment: {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: creator.id,
      name: creator.name || "Unknown",
      imageUrl: creator.imageUrl || "",
    },
  },
});
```

### 5. Update Post Creation Endpoint
After creating post:
```typescript
import { sseBroadcaster } from "@/lib/sse-broadcaster";

// After post is saved
sseBroadcaster.broadcastAll({
  type: "POST_CREATED",
  actionUserId: currentProfile.id,
  post: {
    id: post.id,
    authorId: post.authorId,
    content: post.content,
    fileUrl: post.fileUrl || null,
    fileType: post.fileType as "text" | "image" | "video",
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    likeCount: 0,
    commentCount: 0,
    author: {
      id: creator.id,
      name: creator.name || "Unknown",
      imageUrl: creator.imageUrl || "",
    },
    comments: [],
  },
});
```

## Critical Points

1. ⚠️ **Always include `actionUserId`** - Client uses this to avoid double-counting
2. ⚠️ **Broadcast to ALL connected clients** - Use `broadcastAll()` unless specific profiles need filtering
3. ⚠️ **Use ISO string for dates** - Ensure `.toISOString()` for consistency
4. ⚠️ **Validate authentication** - Check `userId` and profile existence
5. ⚠️ **Handle errors gracefully** - Don't let SSE errors crash the server

## Testing Backend

### 1. Test SSE Connection
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/posts/events
```

Should get: `HTTP/1.1 200 OK` with `Content-Type: text/event-stream`

### 2. Test Event Broadcasting
Open two browser tabs, both connected to `/api/posts/events`. Like a post in one tab. Check if the other tab receives the event in browser console (Network tab > WS/SSE).

### 3. Verify Event Format
Check Network tab's "Response" sub-tab to see raw SSE data:
```
data: {"type":"POST_LIKED","actionUserId":"user-123","postId":"post-456"}
```

## Debugging

### Events not appearing
1. Check `/api/posts/events` is getting requests (Network tab)
2. Check Bearer token is being sent correctly
3. Check SSE broadcaster has listeners registered
4. Check console for errors

### Like count doubled
1. Verify `actionUserId` is being sent
2. Check event deduplication on client (should skip self-events)
3. Verify optimistic update is working

### Comments not showing
1. Verify COMMENT_ADDED event is being broadcast
2. Check comment author info is included
3. Verify PostComments callback is registered
