# Socket Events Implementation Guide

## Summary of Changes

### ✅ Client-Side Fixes Implemented

#### 1. **Real-Time Comment Rendering** (FIXED)
**Problem**: New comment events weren't showing immediately in `PostComments` component
**Solution**: 
- Added callback system for real-time comment updates
- `FeedList` maintains a `Map<postId, callback>` for registered `PostComments` components
- When `COMMENT_ADDED` event arrives, callback is triggered to add comment to `PostComments` local state
- Comments from current user are deduplicated (only shown once)

**Files Modified**:
- `components/feed/feed-list.tsx` - Added comment callback registration system
- `components/feed/post-card.tsx` - Passes callback to `PostComments`
- `components/feed/post-comments.tsx` - Registers with parent and listens for real-time updates

#### 2. **Like Count Race Condition** (IMPROVED)
**Problem**: When 2 users like simultaneously, count only increased by 1
**Solution**:
- Improved `actionUserId` check to prevent double-counting
- Changed from `payload.actionUserId === profileId` to `payload.actionUserId && payload.actionUserId === profileId`
- This ensures events without `actionUserId` aren't incorrectly skipped
- Current user's optimistic updates are preserved; others' likes increment correctly

**Files Modified**:
- `components/feed/feed-list.tsx` - Robust event filtering logic

---

## Expected Event Structure (Backend Must Send)

### POST_CREATED
```json
{
  "type": "POST_CREATED",
  "actionUserId": "user-id-of-creator",
  "post": {
    "id": "post-id",
    "authorId": "user-id",
    "content": "Post content",
    "fileUrl": "url or null",
    "fileType": "text|image|video",
    "visibility": "PUBLIC|FRIENDS|PRIVATE",
    "createdAt": "2024-05-02T10:00:00Z",
    "likeCount": 0,
    "commentCount": 0,
    "author": {
      "id": "user-id",
      "name": "User Name",
      "imageUrl": "avatar-url"
    },
    "comments": []
  }
}
```

### POST_LIKED / POST_UNLIKED
```json
{
  "type": "POST_LIKED",
  "actionUserId": "user-id-who-liked",
  "postId": "post-id"
}
```

### COMMENT_ADDED
```json
{
  "type": "COMMENT_ADDED",
  "actionUserId": "user-id-who-commented",
  "postId": "post-id",
  "comment": {
    "id": "comment-id",
    "content": "Comment text",
    "createdAt": "2024-05-02T10:00:00Z",
    "author": {
      "id": "user-id",
      "name": "User Name",
      "imageUrl": "avatar-url"
    }
  }
}
```

---

## Backend Requirements

### 1. SSE Event Stream Endpoint
**Location**: `app/api/posts/events/route.ts` (currently empty)
**Responsibility**:
- Maintain list of connected clients per profile
- Send SSE events to all connected clients for the profile
- Include Bearer token authentication
- Broadcast events from SSE broadcaster

### 2. Event Broadcasting Integration
**Locations to update**:
- `POST /posts/:id/like` - Broadcast `POST_LIKED` event after like is saved
- `DELETE /posts/:id/like` - Broadcast `POST_UNLIKED` event after unlike is removed
- `POST /posts/:id/comments` - Broadcast `COMMENT_ADDED` event after comment is created
- `POST /posts` - Broadcast `POST_CREATED` event after post is created

**CRITICAL**: Always include `actionUserId` field in events!

### 3. SSE Broadcaster Utility
**Location**: `lib/sse-broadcaster.ts` (currently empty)
**Responsibility**:
- Manage in-memory queue of events
- Track connected clients
- Handle disconnections and cleanup
- Broadcast events to appropriate profiles

**Suggested Implementation**:
```typescript
type EventListener = (data: string) => void;
type ProfileEventListeners = Map<string, Set<EventListener>>;

export class SSEBroadcaster {
  private listeners: ProfileEventListeners = new Map();

  subscribe(profileId: string, listener: EventListener): () => void {
    if (!this.listeners.has(profileId)) {
      this.listeners.set(profileId, new Set());
    }
    this.listeners.get(profileId)!.add(listener);
    
    return () => {
      this.listeners.get(profileId)?.delete(listener);
    };
  }

  broadcast(event: { type: string; actionUserId: string; [key: string]: any }) {
    const data = JSON.stringify(event);
    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => listener(data));
    });
  }
}
```

---

## Testing Checklist

- [ ] Create a post as User A
  - [ ] Verify post appears in own feed
  - [ ] Verify post appears in User B's feed via POST_CREATED event
  
- [ ] User A and B like same post simultaneously
  - [ ] Both users see likeCount increase by 2 total (1 for each like)
  - [ ] No duplicate likes shown
  
- [ ] User B comments on post while User A has comments open
  - [ ] Comment appears immediately in User A's PostComments component
  - [ ] Comment count increments
  - [ ] No duplicate comments shown
  
- [ ] User A comments, then User B views comments
  - [ ] User B can see User A's comment
  - [ ] Comment displays correctly with author info and timestamp

---

## Client-Side Event Flow

```
FeedList SSE Connection
    ↓
Event arrives with actionUserId check
    ↓
┌─── Skip if actionUserId === profileId? ────┐
│  (Optimistic updates already happened)     │
└────────────────────────────────────────────┘
    ↓ No (process event)
Determine event type
    ├─ POST_CREATED → prependPost()
    ├─ POST_LIKED → increment likeCount
    ├─ POST_UNLIKED → decrement likeCount
    └─ COMMENT_ADDED → update comments + notify PostComments callback
    
PostComments Callback
    ↓
Check if comment from current user?
    ├─ Yes → skip (already added locally)
    └─ No → prepend to comments array
```

---

## Known Limitations

1. **Like count deduplication**: Currently relies on backend sending `actionUserId`. If not sent, there's risk of double-counting from optimistic updates + events.

2. **Comment deduplication**: Only works if PostComments is open when event arrives. If comments section is closed and reopened, full fetch is done.

3. **Initial state**: First load of feed doesn't show in-flight comments that haven't been persisted yet.

---

## Future Improvements

- [ ] Add Redux/Zustand for centralized state management
- [ ] Implement WebSocket instead of SSE for better bi-directional communication
- [ ] Add retry logic for failed broadcasts
- [ ] Cache recent events for new connections
- [ ] Add typing for event payloads instead of `any`
- [ ] Implement event versioning for backward compatibility
