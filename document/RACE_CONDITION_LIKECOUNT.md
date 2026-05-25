# Race Condition Fix: Like/Unlike SSE Sync

## Problem
Khi user like/unlike + SSE event tới cùng lúc + optimise UI tăng giảm ngay lập tức khi user like/unlike → UI render sai count.

### Scenario
```
User A: like post (optimistic: +1)
User B: like post → BE: +1 → SSE: likeCount = 2
User A UI: 1 ❌ (sai)
```

## Root Cause
- Dedupe logic block SSE mặc dù state chưa sync
- Optimistic update không match SSE value
- Dedupe theo action ID thay vì state

## Solution

### 1. Optimistic Update (Immediate Feedback)
```typescript
// User click like/unlike → instant UI change
handleLike: () => {
  setPosts(prev => {
    return prev.map(p => ({
      ...p,
      isLiked: !currentIsLiked,
      likeCount: p.likeCount + (nextLiked ? 1 : -1),
    }));
  });
  
  // Call API
  await likePost(api, postId);
}
```

### 2. SSE State Check (Source of Truth)
```typescript
// SSE event tới → compare với state
case "POST_LIKED": {
  const { postId, likeCount } = payload;
  
  setPosts(prev => {
    const post = prev.find(p => p.id === postId);
    
    // Nếu state match SSE → skip (no race condition)
    if (post?.likeCount === likeCount) {
      return prev;
    }
    
    // Nếu khác → update theo SSE (source of truth)
    return prev.map(p => 
      p.id === postId 
        ? { ...p, likeCount }
        : p
    );
  });
}
```

## Key Points
✅ **Optimistic**: UI feedback ngay (realism)
✅ **SSE**: Source of truth (correctness)
✅ **State Check**: Dedupe by state change, không dedupe by event ID
✅ **Reconcile**: SSE auto-fix nếu race condition xảy ra

## Test Case
1. User A like → UI: 1 (optimistic)
2. User B like → BE: 2 → SSE: 2
3. User A SSE tới → compare (1 vs 2) → update
4. Result: UI: 2 ✅

## Files Changed
- `components/feed/feed-list.tsx` - Optimistic + SSE state-check logic
- `lib/sse-client.ts` - Added `likeCount` to payload types
