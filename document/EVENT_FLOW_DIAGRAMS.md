# Socket Events Flow Diagrams

## 1. Real-Time Comment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ When Other User Adds Comment                                    │
└─────────────────────────────────────────────────────────────────┘

User B Creates Comment
        │
        ↓
┌────────────────────────────────────┐
│ POST /posts/:id/comments           │
│ (server saves comment)             │
└────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────────────────────────────┐
│ Server broadcasts COMMENT_ADDED event via SSE                  │
│ {                                                              │
│   type: "COMMENT_ADDED",                                       │
│   actionUserId: "user-b-id",                                   │
│   postId: "post-123",                                          │
│   comment: { id, content, createdAt, author }                 │
│ }                                                              │
└────────────────────────────────────────────────────────────────┘
        │
        ↓ (to all connected clients)
        │
┌────────────────────────────────────────────────────────────────┐
│ User A's FeedList receives SSE event                           │
│                                                                │
│ ✓ Check: Is actionUserId === profileId?                       │
│   NO → Continue processing                                     │
│                                                                │
│ ✓ Handle COMMENT_ADDED case:                                  │
│   - Update FeedList post.comments count                        │
│   - Call postCommentCallback(comment)                          │
└────────────────────────────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────────────────────────────┐
│ PostComments Component Callback Triggered                      │
│                                                                │
│ ✓ Check: comment.author.id !== currentUserId?                 │
│   YES → Add to local state                                     │
│                                                                │
│ ✓ setComments(prev => [newComment, ...prev])                  │
└────────────────────────────────────────────────────────────────┘
        │
        ↓
    ✨ Comment appears immediately! ✨
```

---

## 2. Like Count Race Condition Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│ When 2 Users Like Same Post Simultaneously                      │
└─────────────────────────────────────────────────────────────────┘

TIMELINE:

T1: User A clicks Like
    │
    ├─→ Client A: Optimistic update (+1)
    └─→ API: POST /posts/:id/like

T2: User B clicks Like  
    │
    ├─→ Client B: No optimistic update yet (different client)
    └─→ API: POST /posts/:id/like

T3: Server saves User A's like
    │
    └─→ Broadcast: POST_LIKED { actionUserId: "user-a-id" }

T4: Server saves User B's like
    │
    └─→ Broadcast: POST_LIKED { actionUserId: "user-b-id" }

T5: Both events arrive at User A's client
    │
    ├─→ Event 1: POST_LIKED { actionUserId: "user-a-id" }
    │   ✓ Check: actionUserId && actionUserId === profileId
    │   ✓ YES → Skip (already optimistically updated)
    │
    └─→ Event 2: POST_LIKED { actionUserId: "user-b-id" }
        ✓ Check: actionUserId && actionUserId === profileId
        ✓ NO → Process event
        ✓ likeCount += 1

RESULT: Like count increased by 2 total ✅
        (1 optimistic + 1 from other user's event)

---

T6: Both events arrive at User B's client
    │
    ├─→ Event 1: POST_LIKED { actionUserId: "user-a-id" }
    │   ✓ Check: actionUserId !== profileId
    │   ✓ Process → likeCount += 1
    │
    └─→ Event 2: POST_LIKED { actionUserId: "user-b-id" }
        ✓ Check: actionUserId === profileId
        ✓ Skip (already in progress)

RESULT: Like count increased by 2 total ✅
        (1 from event + 1 from API response handling)
```

---

## 3. Component Registration Flow

```
┌──────────────────────────────────────────────────────────┐
│ FeedList                                                 │
│                                                          │
│ const commentCallbacksRef =                             │
│   useRef<Map<string, (comment) => void>>()              │
│                                                          │
│ const registerCommentCallback = (postId, callback) => { │
│   commentCallbacksRef.current.set(postId, callback);    │
│   return () => commentCallbacksRef.delete(postId);      │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
           │
           │ onRegisterCommentCallback={registerCommentCallback}
           ↓
┌──────────────────────────────────────────────────────────┐
│ PostCard                                                 │
│                                                          │
│ <PostComments                                            │
│   onRegisterCommentCallback={onRegisterCommentCallback}  │
│ />                                                       │
└──────────────────────────────────────────────────────────┘
           │
           │
           ↓
┌──────────────────────────────────────────────────────────┐
│ PostComments (mounts)                                    │
│                                                          │
│ useEffect(() => {                                        │
│   const handleRealtimeComment = (comment) => {           │
│     if (comment.author.id !== currentUserId) {           │
│       setComments(prev => [comment, ...prev]);           │
│     }                                                    │
│   };                                                     │
│   const unregister = onRegisterCommentCallback(          │
│     postId,                                              │
│     handleRealtimeComment                                │
│   );                                                     │
│   return unregister;                                     │
│ }, [postId, currentUserId]);                             │
└──────────────────────────────────────────────────────────┘

When COMMENT_ADDED event arrives:
    │
    ├─→ FeedList calls: commentCallbacksRef.get(postId)(comment)
    │
    └─→ PostComments receives comment in handleRealtimeComment
        └─→ Adds to local state if not from current user
```

---

## 4. Event Processing Decision Tree

```
SSE Event Received
    │
    ├─ Check: actionUserId && actionUserId === profileId?
    │   │
    │   YES → Skip event (already optimistically updated)
    │   │     (Return early)
    │   │
    │   NO → Continue processing
    │
    └─ Switch payload.type:
       │
       ├─ "POST_CREATED"
       │  └─→ prependPost(payload.post)
       │
       ├─ "POST_LIKED"
       │  └─→ Find post, increment likeCount
       │
       ├─ "POST_UNLIKED"
       │  └─→ Find post, decrement likeCount
       │
       └─ "COMMENT_ADDED"
          ├─→ Find post, update comments array
          ├─→ Update commentCount
          └─→ Call commentCallback if registered
             └─→ PostComments adds comment to local state
```

---

## 5. Data Flow: Current User Creates Comment

```
┌────────────────────────────────────┐
│ User A types comment and submits   │
└────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────┐
│ PostComments handleSubmit()                 │
│                                             │
│ 1. Add to local comments immediately        │
│    setComments(prev => [newComment, ...])   │
│                                             │
│ 2. Clear input                              │
│    setContent("")                           │
│                                             │
│ 3. Call parent callback                     │
│    onCommentAdded()                         │
└─────────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────┐
│ API call: POST /posts/:id/comments │
└────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────┐
│ Server saves comment                   │
│ Broadcasts COMMENT_ADDED event         │
└────────────────────────────────────────┘
        │
        ↓ (SSE stream to all clients)
        │
┌────────────────────────────────────────────────┐
│ User A receives event:                         │
│ - Skips (actionUserId === profileId)           │
│ - Comment already in UI from step 1            │
└────────────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────────────┐
│ User B receives event:                         │
│ - Processes (actionUserId !== profileId)       │
│ - Adds comment to PostComments local state     │
│ - Displays immediately                         │
└────────────────────────────────────────────────┘
```

---

## Color Legend for Diagrams

✅ = Working/Correct  
❌ = Not implemented (backend needed)  
⚠️ = Needs backend field  
✨ = End result
